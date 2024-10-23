module.exports = {
	extends: [ '@martin-kolarik/eslint-config/typescript' ],
	parserOptions: {
		EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
		project: 'packages/*/tsconfig.json',
	},
	rules: {
		'no-console': 'off',
	},
	overrides: [
		{
			files: [
				'**',
			],
			rules: {
				'camelcase': 'off',
				'n/no-extraneous-import': [
					'error',
					{ allowModules: [ 'msw', 'vitest' ] },
				],
			},
		},
		{
			files: [
				'**/tsconfig.json',
			],
			rules: {
				'jsonc/no-comments': 'off',
			},
		},
		{
			files: [
				'**/tests/**',
			],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
				'no-restricted-properties': [
					'error',
					{
						object: 'sinon',
						property: 'spy',
					},
					{
						object: 'sinon',
						property: 'stub',
					},
					{
						object: 'sinon',
						property: 'mock',
					},
					{
						object: 'sinon',
						property: 'fake',
					},
					{
						object: 'sinon',
						property: 'restore',
					},
					{
						object: 'sinon',
						property: 'reset',
					},
					{
						object: 'sinon',
						property: 'resetHistory',
					},
					{
						object: 'sinon',
						property: 'resetBehavior',
					},
				],
			},
		},
	],
};
