import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { createClient } from '@magierin-schnee/solr-client';

export class Solr implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Solr',
        name: 'solr',
        group: ['transform'],
        version: 1,
        description: 'Interact with Apache Solr',
        defaults: {
            name: 'Solr',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'solrApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Add Document',
                        value: 'add',
                        action: 'Add document',
                    },
                    {
                        name: 'Search',
                        value: 'search',
                        action: 'Search documents',
                    },
                    {
                        name: 'Delete by ID',
                        value: 'delete',
                        action: 'Delete document by ID',
                    },
                ],
                default: 'add',
            },
            {
                displayName: 'Document',
                name: 'document',
                type: 'json',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['add'],
                    },
                },
                description: 'Document JSON or array of documents to add',
            },
            {
                displayName: 'Query',
                name: 'query',
                type: 'string',
                default: '*:*',
                displayOptions: {
                    show: {
                        operation: ['search'],
                    },
                },
                description: 'Solr query string',
            },
            {
                displayName: 'Document ID',
                name: 'documentId',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        operation: ['delete'],
                    },
                },
                description: 'ID of the document to delete',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const creds = (await this.getCredentials('solrApi')) as {
            host: string;
            port: string;
            core: string;
            path: string;
            secure: boolean;
            username?: string;
            password?: string;
        };

        const client = createClient({
            host: creds.host,
            port: creds.port,
            core: creds.core,
            path: creds.path,
            secure: creds.secure,
        });

        if (creds.username || creds.password) {
            client.setBasicAuth(creds.username || '', creds.password || '');
        }

        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                if (operation === 'add') {
                    const docParam = this.getNodeParameter('document', i) as string | object;
                    const document = typeof docParam === 'string' ? JSON.parse(docParam) : docParam;
                    const response = await client.addDocuments(document, { commit: true });
                    returnData.push({ json: response as unknown as IDataObject });
                } else if (operation === 'search') {
                    const queryStr = this.getNodeParameter('query', i) as string;
                    const query = client.createQuery().setQuery(queryStr);
                    const response = await client.searchDocuments(query);
                    returnData.push({ json: response.response as unknown as IDataObject });
                } else if (operation === 'delete') {
                    const id = this.getNodeParameter('documentId', i) as string;
                    const response = await client.deleteById(id, { commit: true });
                    returnData.push({ json: response as unknown as IDataObject });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message } });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
            }
        }

        return [returnData];
    }
}
