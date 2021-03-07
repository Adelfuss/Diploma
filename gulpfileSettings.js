const gulpProjectSetting = {
	sourceFolder : 'src',
	distFolder : 'dist',
	baseDir : 'dist',
	sassCompilerOutputType : 'expanded',
	serverPort: 3000,
	compiledCss: 'dist/css/*.css',
	bundleCssFiles: ['bootstrap.css','index.css'],
	sourcemapsFiles: ['index.css.map','bootstrap.css.map'],
	bootstrapScssEntryPoint: '/libs/bootstrap-4.4.1/scss/bootstrap.scss',
	nativeScssEntryPoint: '/scss/index.scss',
	nativeScss: '/scss/**/*.scss',
	nativePug: '/pugIncludes/**/*.pug',
	modifyCssUrlsPrepend: '../img/'
};

module.exports = gulpProjectSetting;