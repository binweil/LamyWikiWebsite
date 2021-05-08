import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {Construct} from "@aws-cdk/core";

export class BackendStack extends Construct{
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const database = new dynamodb.Table(this, 'wiki-info-table', {
            tableName: 'wiki-info-table',
            partitionKey: {name: 'wiki_id', type: dynamodb.AttributeType.STRING}
        })
    }
}
