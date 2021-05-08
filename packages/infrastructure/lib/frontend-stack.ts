import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import {HttpMethods} from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as targets from '@aws-cdk/aws-route53-targets/lib';

import {RemovalPolicy} from '@aws-cdk/core';
import {CfnDistribution, OriginAccessIdentity} from "@aws-cdk/aws-cloudfront";

export class MiniTwitterFrontEndStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domain = 'wiki-docs.com';
    const subdomain = 'mini-twitter-cdk';
    const siteDomain = subdomain + '.' + domain;

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domain });

    const bucketCORSRule: s3.CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT, HttpMethods.DELETE, HttpMethods.HEAD],
      allowedHeaders: ['*'],
      allowedOrigins: ['*']
    }

    const siteContentBucket = new s3.Bucket(this, 'mini-twitter-site-contents', {
      bucketName: 'mini-twitter-site-contents',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [bucketCORSRule]
    });
    new cdk.CfnOutput(this, 'BucketName', { value: siteContentBucket.bucketName });

    // TLS certificate
    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      region: 'us-east-1',
    }).certificateArn;
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    const cloudFrontDist = new cloudfront.CloudFrontWebDistribution(this, 'mini-twitter-dist', {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [ siteDomain ],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteContentBucket,
            originAccessIdentity: new OriginAccessIdentity(this, 'OAI')
          },
          behaviors : [ {isDefaultBehavior: true}],
        }
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html'
        },
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html'
        }
      ]
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: cloudFrontDist.distributionId });

    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudFrontDist)),
      zone
    });

    // new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
    //   sources: [s3deploy.Source.asset('')],
    //   destinationBucket: siteContentBucket,
    //   distribution: cloudFrontDist,
    //   distributionPaths: ['/*'],
    // });
    new cdk.CfnOutput(this, 'Endpoint', { value: "https://" + siteDomain });
  }
}
