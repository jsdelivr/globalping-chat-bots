require('@ayuhito/eslint-config/patch');

module.exports = {
	extends: ['@ayuhito/eslint-config/profile/node'],
	parserOptions: {
		EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
		project: 'packages/*/tsconfig.json',
	},
	rules: {
		'no-console': 'off',
		'unicorn/prefer-top-level-await': 'off',
	},
};
