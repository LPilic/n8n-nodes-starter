import {
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { LinkedinScraper, events } from 'linkedin-jobs-scraper';

export class LinkedinScraperNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LinkedIn Scraper',
		name: 'linkedinScraper',
		group: ['transform'],
		version: 1,
		description: 'Search jobs on LinkedIn',
		defaults: {
			name: 'LinkedIn Scraper',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Job keywords to search for',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Location to search in',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const query = this.getNodeParameter('query', itemIndex) as string;
				const location = this.getNodeParameter('location', itemIndex, '') as string;
				const limit = this.getNodeParameter('limit', itemIndex, 10) as number;

				const scraper = new LinkedinScraper({ headless: true });
				const results: INodeExecutionData[] = [];

				scraper.on(events.scraper.data, (data) => {
					results.push({ json: data as unknown as IDataObject });
				});

				await scraper.run({
					query,
					options: {
						locations: location ? [location] : [],
						limit,
					},
				});

				await scraper.close();

				returnItems.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
					continue;
				}

				if (error.context) {
					error.context.itemIndex = itemIndex;
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnItems];
	}
}
