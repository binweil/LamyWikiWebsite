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
import {Construct} from "constructs";

export class BackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const database = new dynamodb.Table(this, 'wiki-info-table', {
            tableName: 'wiki-info-table',
            partitionKey: {name: 'wiki_id', type: dynamodb.AttributeType.STRING}
        })
        new cdk.CfnOutput(this, 'WikiInfoTableName', {value: database.tableName});
    }
}
