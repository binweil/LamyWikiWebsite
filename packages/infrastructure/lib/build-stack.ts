import {App, Aws, Stack, StackProps} from "@aws-cdk/core";
import {Repository} from "@aws-cdk/aws-codecommit";
import {LinuxBuildImage, PipelineProject} from "@aws-cdk/aws-codebuild";
import {Artifact, Pipeline} from "@aws-cdk/aws-codepipeline";
import {
    CloudFormationCreateReplaceChangeSetAction,
    CloudFormationExecuteChangeSetAction,
    CodeBuildAction,
    CodeCommitSourceAction
} from "@aws-cdk/aws-codepipeline-actions"
import {IKey} from "@aws-cdk/aws-kms";
import {AccountPrincipal, Effect, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";

export class BuildStack extends Stack {
    public readonly artifactBucketEncryptionKey?: IKey;

    constructor(parent: App, name: string, props?: StackProps) {
        super(parent, name, props);

        const stageMap:{[key:string]: string[]} = {
            beta: ['us-west-2']
        }

        const sourceCodeRepo = new Repository(this, 'LamyWikiRepo', {
            repositoryName: "LamyWikiWebsite"
        });

        const pipeline = new Pipeline(this, 'Pipeline');
        this.artifactBucketEncryptionKey = pipeline.artifactBucket.encryptionKey;
        if (this.artifactBucketEncryptionKey) {
            this.artifactBucketEncryptionKey.grant(
                new AccountPrincipal(Aws.ACCOUNT_ID),
                "kms:*"
            )
        }
        pipeline.addToRolePolicy(
            new PolicyStatement({actions: ["iam:PassRole"], resources: ['*']})
        );
        pipeline.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    "cloudFormation:Describe*",
                    "cloudFormation:Get*",
                    "cloudFormation:List*",
                    "cloudFormation:Validate*",
                    "cloudFormation:CreateChangeSet",
                    "cloudFormation:ExecuteChangeSet",
                    "cloudFormation:DeleteChangeSet"],
                resources: ['*']})
        );
        pipeline.addToRolePolicy(
            new PolicyStatement({actions: ["s3:*"], resources: ['*']})
        );
        pipeline.artifactBucket.addToResourcePolicy(new PolicyStatement({
                actions: ["s3:GetObject*"],
                resources: [pipeline.artifactBucket.arnForObjects("*")],
                principals: [new AccountPrincipal(Aws.ACCOUNT_ID)]
            })
        );

        const sourceOutput = new Artifact('SourceOutput');
        const sourceStage = pipeline.addStage({stageName: 'Source'});
        sourceStage.addAction(new CodeCommitSourceAction({
            actionName: "source",
            repository: sourceCodeRepo,
            branch: "development",
            output: sourceOutput
        }));

        const buildStage = pipeline.addStage({
            stageName: "build"
        });
        const project = new PipelineProject(this, 'LamyWikiBuildProject',{
            environment: {
                buildImage: LinuxBuildImage.STANDARD_3_0
            }
        });
        project.addToRolePolicy(new PolicyStatement({
            actions: ['codeartifact:*'],
            resources: ['*']
        }));
        project.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:*'],
            resources: ['*']
        }));

        const buildOutput = new Artifact('BuildOutput');
        buildStage.addAction(new CodeBuildAction({
            actionName: "CDK_Build",
            project,
            input: sourceOutput,
            outputs: [buildOutput]
        }))

        const stackName = "LamyWikiStack";

        Object.keys(stageMap).forEach(stage =>{
            const stageSpecificStage = pipeline.addStage({
                stageName: `Update-${stage}`
            });
            stageMap[stage].forEach(region=>{
                const changeSetName = `ChangeSetUpdate-${stage}-${region}`;
                stageSpecificStage.addAction(new CloudFormationCreateReplaceChangeSetAction({
                    actionName: `CreateChangeSet-${stage}-${region}`,
                    region,
                    stackName,
                    changeSetName,
                    adminPermissions: true,
                    runOrder: 1,
                    templatePath: buildOutput.atPath('build/FrontEndStack.template.json'),
                    templateConfiguration: buildOutput.atPath('build/templateConfig.json')
                }));
                stageSpecificStage.addAction(new CloudFormationExecuteChangeSetAction({
                    actionName: `ExecuteChangeSet-${stage}-${region}`,
                    region,
                    stackName,
                    runOrder: 2,
                    changeSetName
                }))
            })
        })
    }
}
