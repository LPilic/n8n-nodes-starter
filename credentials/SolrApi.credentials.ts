import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SolrApi implements ICredentialType {
    name = 'solrApi';
    displayName = 'Solr API';
    documentationUrl = 'https://www.npmjs.com/package/@magierin-schnee/solr-client';
    properties: INodeProperties[] = [
        {
            displayName: 'Host',
            name: 'host',
            type: 'string',
            default: '127.0.0.1',
        },
        {
            displayName: 'Port',
            name: 'port',
            type: 'string',
            default: '8983',
        },
        {
            displayName: 'Core',
            name: 'core',
            type: 'string',
            default: '',
        },
        {
            displayName: 'Path',
            name: 'path',
            type: 'string',
            default: '/solr',
        },
        {
            displayName: 'Use SSL',
            name: 'secure',
            type: 'boolean',
            default: false,
        },
        {
            displayName: 'Username',
            name: 'username',
            type: 'string',
            default: '',
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
        },
    ];
}
