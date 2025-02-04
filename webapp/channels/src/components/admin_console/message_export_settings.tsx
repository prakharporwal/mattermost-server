// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {ReactNode} from 'react';
import {FormattedMessage} from 'react-intl';

import type {AdminConfig} from '@mattermost/types/config';
import type {Job} from '@mattermost/types/jobs';

import ExternalLink from 'components/external_link';
import FormattedMarkdownMessage from 'components/formatted_markdown_message';

import {DocLinks, JobTypes, exportFormats} from 'utils/constants';
import {getSiteURL} from 'utils/url';
import * as Utils from 'utils/utils';

import type {BaseProps, BaseState} from './admin_settings';
import AdminSettings from './admin_settings';
import BooleanSetting from './boolean_setting';
import DropdownSetting from './dropdown_setting';
import JobsTable from './jobs';
import RadioSetting from './radio_setting';
import SettingsGroup from './settings_group';
import TextSetting from './text_setting';

interface State extends BaseState {
    enableComplianceExport: AdminConfig['MessageExportSettings']['EnableExport'];
    exportFormat: AdminConfig['MessageExportSettings']['ExportFormat'];
    exportJobStartTime: AdminConfig['MessageExportSettings']['DailyRunTime'];
    globalRelayCustomerType: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['CustomerType'];
    globalRelaySMTPUsername: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['SMTPUsername'];
    globalRelaySMTPPassword: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['SMTPPassword'];
    globalRelayEmailAddress: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['EmailAddress'];
    globalRelayCustomSMTPServerName: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['CustomSMTPServerName'];
    globalRelayCustomSMTPPort: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['CustomSMTPPort'];
    globalRelaySMTPServerTimeout: AdminConfig['MessageExportSettings']['GlobalRelaySettings']['SMTPServerTimeout'];
}

export default class MessageExportSettings extends AdminSettings<BaseProps, State> {
    getConfigFromState = (config: AdminConfig) => {
        config.MessageExportSettings.EnableExport = this.state.enableComplianceExport;
        config.MessageExportSettings.ExportFormat = this.state.exportFormat;
        config.MessageExportSettings.DailyRunTime = this.state.exportJobStartTime;

        if (this.state.exportFormat === exportFormats.EXPORT_FORMAT_GLOBALRELAY) {
            config.MessageExportSettings.GlobalRelaySettings = {
                CustomerType: this.state.globalRelayCustomerType,
                SMTPUsername: this.state.globalRelaySMTPUsername,
                SMTPPassword: this.state.globalRelaySMTPPassword,
                EmailAddress: this.state.globalRelayEmailAddress,
                CustomSMTPServerName: this.state.globalRelayCustomSMTPServerName,
                CustomSMTPPort: this.state.globalRelayCustomSMTPPort,
                SMTPServerTimeout: this.state.globalRelaySMTPServerTimeout,
            };
        }
        return config;
    };

    getStateFromConfig(config: AdminConfig) {
        const state: State = {
            enableComplianceExport: config.MessageExportSettings.EnableExport,
            exportFormat: config.MessageExportSettings.ExportFormat,
            exportJobStartTime: config.MessageExportSettings.DailyRunTime,
            globalRelayCustomerType: '',
            globalRelaySMTPUsername: '',
            globalRelaySMTPPassword: '',
            globalRelayEmailAddress: '',
            globalRelaySMTPServerTimeout: 0,
            globalRelayCustomSMTPServerName: '',
            globalRelayCustomSMTPPort: '',
            saveNeeded: false,
            saving: false,
            serverError: null,
            errorTooltip: false,
        };
        if (config.MessageExportSettings.GlobalRelaySettings) {
            state.globalRelayCustomerType = config.MessageExportSettings.GlobalRelaySettings.CustomerType;
            state.globalRelaySMTPUsername = config.MessageExportSettings.GlobalRelaySettings.SMTPUsername;
            state.globalRelaySMTPPassword = config.MessageExportSettings.GlobalRelaySettings.SMTPPassword;
            state.globalRelayEmailAddress = config.MessageExportSettings.GlobalRelaySettings.EmailAddress;
            state.globalRelayCustomSMTPServerName = config.MessageExportSettings.GlobalRelaySettings.CustomSMTPServerName;
            state.globalRelayCustomSMTPPort = config.MessageExportSettings.GlobalRelaySettings.CustomSMTPPort;
        }
        return state;
    }

    getJobDetails = (job: Job) => {
        if (job.data) {
            const message = [];
            if (job.data.messages_exported) {
                message.push(
                    <FormattedMessage
                        id='admin.complianceExport.messagesExportedCount'
                        defaultMessage='{count} messages exported.'
                        values={{
                            count: job.data.messages_exported,
                        }}
                    />,
                );
            }
            if (job.data.warning_count > 0) {
                if (job.data.export_type === exportFormats.EXPORT_FORMAT_GLOBALRELAY) {
                    message.push(
                        <div>
                            <FormattedMessage
                                id='admin.complianceExport.warningCount.globalrelay'
                                defaultMessage='{count} warning(s) encountered, see log for details'
                                values={{
                                    count: job.data.warning_count,
                                }}
                            />
                        </div>,
                    );
                } else {
                    message.push(
                        <div>
                            <FormattedMessage
                                id='admin.complianceExport.warningCount'
                                defaultMessage='{count} warning(s) encountered, see warning.txt for details'
                                values={{
                                    count: job.data.warning_count,
                                }}
                            />
                        </div>,
                    );
                }
            }
            return message;
        }
        return null;
    };

    renderTitle() {
        return (
            <FormattedMessage
                id='admin.complianceExport.title'
                defaultMessage='Compliance Export'
            />
        );
    }

    renderSettings = () => {
        const exportFormatOptions = [
            {value: exportFormats.EXPORT_FORMAT_ACTIANCE, text: Utils.localizeMessage('admin.complianceExport.exportFormat.actiance', 'Actiance XML')},
            {value: exportFormats.EXPORT_FORMAT_CSV, text: Utils.localizeMessage('admin.complianceExport.exportFormat.csv', 'CSV')},
            {value: exportFormats.EXPORT_FORMAT_GLOBALRELAY, text: Utils.localizeMessage('admin.complianceExport.exportFormat.globalrelay', 'GlobalRelay EML')},
        ];

        // if the export format is globalrelay, the user needs to set some additional parameters
        let globalRelaySettings;
        if (this.state.exportFormat === exportFormats.EXPORT_FORMAT_GLOBALRELAY) {
            const globalRelayCustomerType = (
                <RadioSetting
                    id='globalRelayCustomerType'
                    values={[
                        {value: 'A9', text: Utils.localizeMessage('admin.complianceExport.globalRelayCustomerType.a9.description', 'A9/Type 9')},
                        {value: 'A10', text: Utils.localizeMessage('admin.complianceExport.globalRelayCustomerType.a10.description', 'A10/Type 10')},
                        {value: 'CUSTOM', text: Utils.localizeMessage('admin.complianceExport.globalRelayCustomerType.custom.description', 'Custom')},
                    ]}
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomerType.title'
                            defaultMessage='Customer Type:'
                        />
                    }
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomerType.description'
                            defaultMessage='The type of GlobalRelay customer account that your organization has.'
                        />
                    }
                    value={this.state.globalRelayCustomerType ? this.state.globalRelayCustomerType : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.CustomerType')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            const globalRelaySMTPUsername = (
                <TextSetting
                    id='globalRelaySMTPUsername'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelaySMTPUsername.title'
                            defaultMessage='SMTP Username:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.globalRelaySMTPUsername.example', 'E.g.: "globalRelayUser"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelaySMTPUsername.description'
                            defaultMessage='The username that is used to authenticate against the GlobalRelay SMTP server.'
                        />
                    }
                    value={this.state.globalRelaySMTPUsername ? this.state.globalRelaySMTPUsername : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.SMTPUsername')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            const globalRelaySMTPPassword = (
                <TextSetting
                    id='globalRelaySMTPPassword'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelaySMTPPassword.title'
                            defaultMessage='SMTP Password:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.globalRelaySMTPPassword.example', 'E.g.: "globalRelayPassword"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelaySMTPPassword.description'
                            defaultMessage='The password that is used to authenticate against the GlobalRelay SMTP server.'
                        />
                    }
                    value={this.state.globalRelaySMTPPassword ? this.state.globalRelaySMTPPassword : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.SMTPPassword')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            const globalRelayEmail = (
                <TextSetting
                    id='globalRelayEmailAddress'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayEmailAddress.title'
                            defaultMessage='Email Address:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.globalRelayEmailAddress.example', 'E.g.: "globalrelay@mattermost.com"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayEmailAddress.description'
                            defaultMessage='The email address that your GlobalRelay server monitors for incoming Compliance Exports.'
                        />
                    }
                    value={this.state.globalRelayEmailAddress ? this.state.globalRelayEmailAddress : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.EmailAddress')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            const globalRelaySMTPServerName = (
                <TextSetting
                    id='globalRelayCustomSMTPServerName'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomSMTPServerName.title'
                            defaultMessage='SMTP Server Name:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.globalRelayCustomSMTPServerName.example', 'E.g.: "feeds.globalrelay.com"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomSMTPServerName.description'
                            defaultMessage='The SMTP server name that will receive your Global Relay EML.'
                        />
                    }
                    value={this.state.globalRelayCustomSMTPServerName ? this.state.globalRelayCustomSMTPServerName : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.CustomSMTPServerName')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            const globalRelaySMTPPort = (
                <TextSetting
                    id='globalRelayCustomSMTPPort'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomSMTPPort.title'
                            defaultMessage='SMTP Server Port:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.globalRelayCustomSMTPPort.example', 'E.g.: "25"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.globalRelayCustomSMTPPort.description'
                            defaultMessage='The SMTP server port that will receive your Global Relay EML.'
                        />
                    }
                    value={this.state.globalRelayCustomSMTPPort ? this.state.globalRelayCustomSMTPPort : ''}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.GlobalRelaySettings.CustomSMTPPort')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            );

            globalRelaySettings = (
                <SettingsGroup id={'globalRelaySettings'} >
                    {globalRelayCustomerType}
                    {globalRelaySMTPUsername}
                    {globalRelaySMTPPassword}
                    {globalRelayEmail}
                    {
                        this.state.globalRelayCustomerType === 'CUSTOM' &&
                        globalRelaySMTPServerName
                    }
                    {
                        this.state.globalRelayCustomerType === 'CUSTOM' &&
                        globalRelaySMTPPort
                    }
                </SettingsGroup>
            );
        }

        const dropdownHelpText = (
            <FormattedMarkdownMessage
                id='admin.complianceExport.exportFormat.description'
                defaultMessage='Format of the compliance export. Corresponds to the system that you want to import the data into.\n \nFor Actiance XML, compliance export files are written to the \"exports\" subdirectory of the configured [Local Storage Directory]({siteURL}/admin_console/environment/file_storage). For Global Relay EML, they are emailed to the configured email address.'
                values={{siteURL: getSiteURL()}}
            />
        );

        return (
            <SettingsGroup>
                <BooleanSetting
                    id='enableComplianceExport'
                    label={
                        <FormattedMessage
                            id='admin.service.complianceExportTitle'
                            defaultMessage='Enable Compliance Export:'
                        />
                    }
                    helpText={
                        <FormattedMessage
                            id='admin.service.complianceExportDesc'
                            defaultMessage='When true, Mattermost will export all messages that were posted in the last 24 hours. The export task is scheduled to run once per day. See <link>the documentation</link> to learn more.'
                            values={{
                                link: (msg: ReactNode) => (
                                    <ExternalLink
                                        href={DocLinks.COMPILANCE_EXPORT}
                                        location='message_export_settings'
                                    >
                                        {msg}
                                    </ExternalLink>
                                ),
                            }}
                        />
                    }
                    value={this.state.enableComplianceExport}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.EnableExport')}
                    disabled={this.props.isDisabled}
                />

                <TextSetting
                    id='exportJobStartTime'
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.exportJobStartTime.title'
                            defaultMessage='Compliance Export Time:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.complianceExport.exportJobStartTime.example', 'E.g.: "02:00"')}
                    helpText={
                        <FormattedMessage
                            id='admin.complianceExport.exportJobStartTime.description'
                            defaultMessage='Set the start time of the daily scheduled compliance export job. Choose a time when fewer people are using your system. Must be a 24-hour time stamp in the form HH:MM.'
                        />
                    }
                    value={this.state.exportJobStartTime}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.DailyRunTime')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />

                <DropdownSetting
                    id='exportFormat'
                    values={exportFormatOptions}
                    label={
                        <FormattedMessage
                            id='admin.complianceExport.exportFormat.title'
                            defaultMessage='Export Format:'
                        />
                    }
                    helpText={dropdownHelpText}
                    value={this.state.exportFormat}
                    onChange={this.handleChange}
                    setByEnv={this.isSetByEnv('DataRetentionSettings.ExportFormat')}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />

                {globalRelaySettings}

                <JobsTable
                    jobType={JobTypes.MESSAGE_EXPORT}
                    createJobButtonText={
                        <FormattedMessage
                            id='admin.complianceExport.createJob.title'
                            defaultMessage='Run Compliance Export Job Now'
                        />
                    }
                    createJobHelpText={
                        <FormattedMessage
                            id='admin.complianceExport.createJob.help'
                            defaultMessage='Initiates a Compliance Export job immediately.'
                        />
                    }
                    getExtraInfoText={this.getJobDetails}
                    disabled={this.props.isDisabled || !this.state.enableComplianceExport}
                />
            </SettingsGroup>
        );
    };
}
