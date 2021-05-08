import * as cdk from '@aws-cdk/core';
import {Duration} from '@aws-cdk/core';
import * as apiGateway from '@aws-cdk/aws-apigateway';
import {AuthorizationType} from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';
import {AccountRecovery} from '@aws-cdk/aws-cognito';
import * as path from "path";
import * as fs from "fs";

export class MiniTwitterBackEndStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const domain = 'wiki-docs.com';
        const subdomain = 'mini-twitter';
        const origin = 'https://' + subdomain + '.' + domain;

        const database = new dynamodb.Table(this, 'user-info-table', {
            tableName: 'user-info-table',
            partitionKey: {name: 'username', type: dynamodb.AttributeType.STRING}
        })
        new cdk.CfnOutput(this, 'UserInfoTableName', {value: database.tableName});

        const userPool = new cognito.UserPool(this, 'Mini-Twitter-User-Pool', {
            userPoolName: 'Mini-Twitter-User-Pool',
            passwordPolicy: {
                tempPasswordValidity: Duration.days(1),
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true
            },
            standardAttributes: {
                email: {
                    required: true
                }
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: 'Verify your email for our mini twitter!',
                emailBody: 'Thanks for signing up to our mini twitter! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
                smsMessage: 'Thanks for signing up to our mini twitter! Your verification code is {####}',
            },
            signInAliases: {
                email: true,
                username: true
            }
        });
        const client = userPool.addClient("Mini-Twitter", {
            userPoolClientName: "Mini-Twitter-Client",
            authFlows: {
                userPassword: true
            }
        });
        new cdk.CfnOutput(this, 'UserPoolID', {value: userPool.userPoolId});
        new cdk.CfnOutput(this, 'UserPoolClientID', {value: client.userPoolClientId});

        // const postHandlerCode = fs.readFileSync(
        //     "lambda/userinfo-lambda-post.js",
        //     "utf-8"
        // )
        // const postHandler = new lambda.Function(this, 'lambda-post', {
        //     runtime: lambda.Runtime.NODEJS_12_X,
        //     handler: 'index.handler',
        //     code: lambda.Code.fromInline(postHandlerCode)
        // })
        // database.grantFullAccess(postHandler);
        // const postAPIIntegration = new apiGateway.LambdaIntegration(postHandler);

        const api = new apiGateway.RestApi(this, "Mini-Twitter-API", {
            description: 'API Gateway for fetching user information from database',
            defaultCorsPreflightOptions: {
                allowMethods: apiGateway.Cors.ALL_METHODS,
                allowOrigins: [origin],
                allowHeaders: ['*']
            }
        });

        // const userInfo = api.root.addResource("UserInfo");
        // const authorizer = new apiGateway.CognitoUserPoolsAuthorizer(this, 'User-Info-Authorizer', {
        //     cognitoUserPools: [userPool]
        // });

        // userInfo.addMethod('POST', postAPIIntegration, {
        //     authorizer: authorizer,
        //     authorizationType: AuthorizationType.COGNITO,
        // });
        // userInfo.addMethod('OPTIONS', optionsAPIIntegration);
    }
}
