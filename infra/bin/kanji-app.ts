#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { KanjiAppStack } from '../lib/kanji-app-stack'

const app = new cdk.App()
new KanjiAppStack(app, 'KanjiAppStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})
