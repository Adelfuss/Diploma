const {src,dest,watch,series,parallel} = require('gulp');
const pug = require('gulp-pug');
const rep = require('gulp-replace-image-src-from-data-attr');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const gulpIgnore = require('gulp-ignore');
const sourcemaps = require('gulp-sourcemaps');
const modifyCssUrls = require('gulp-modify-css-urls');
const prettify = require('gulp-html-prettify');
const imagemin = require('gulp-imagemin');
const inject = require('gulp-inject');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const rename = require("gulp-rename");

const localSettings = require('./gulpfileSettings.js');

//start: commented current not actual plugins  

//const es = require('event-stream')
//const seria = require('stream-series');
//const webp = require("imagemin-webp");
//const extReplace = require("gulp-ext-replace");

//end: commented current not actual plugins


// function htmlAsset: function for converting pug into html with next chain of plugins:
// [
// pug{pug compiler} =>
// rep{replace pathes in img tag} => 
// inject{inject css and js files into compiled index.html file via comments} =>
// prettify {prettify html output} =>
// ]
function htmlAsset() {
	const sources = src([localSettings.compiledCss], {read: false});
	return src(`${localSettings.sourceFolder}/index.pug`)
	.pipe(pug({pretty: true}))
	.pipe(rep({
            keepOrigin : false
     }))
	.pipe(inject(sources, {
		transform: function(filepath) {
			let correctFilepath = filepath.replace(/\/dist/i,'');
			let regexp = /[.]css/;
			let isCssFile = regexp.test(correctFilepath);
			if (isCssFile) {
				return `<link rel="stylesheet" href="${correctFilepath}">`;
			} else {
				return `<script src="${correctFilepath}"></script>`;
			}
		}
	}))
	.pipe(prettify({indent_char: '  ', indent_size: 2}))
	.pipe(dest(localSettings.distFolder));
}

//function cssAsset: function for compiling scss and generate sourcemaps urlmapping string in the end of index.css(native css bundle) and external css library (bootstrap5)
// [
// sass{compile scss into css} =>
// modifyCssUrls{change urls in css properties} =>
// sourcemaps{write sourcemaps for files} =>
// gulpIgnore{filter files in stream} => 
// ]
function cssAsset() {
	const condition = localSettings.bundleCssFiles;
	return src([`${localSettings.sourceFolder}${localSettings.bootstrapScssEntryPoint}`,`${localSettings.sourceFolder}${localSettings.nativeScss}`])
	.pipe(sourcemaps.init())
	.pipe(sass({outputStyle: localSettings.sassCompilerOutputType}).on('error', sass.logError))
	.pipe(modifyCssUrls({
      modify(url, filePath) {
      	let correctUrl = url.replace(/([.]{2}\/)?[.]{2}\/img\//mi,'');
      	console.log(correctUrl,filePath);
        return correctUrl;
      },
      prepend: localSettings.modifyCssUrlsPrepend,
    }))
    .pipe(sourcemaps.write(''))
	.pipe(gulpIgnore.include(condition))
	.pipe(dest(`${localSettings.distFolder}/css`))
	.pipe(browserSync.stream());
}

//function sourceMapAsset: function for generating real sourcemaps for native css bundle(index.css) and bootstrap5
// [
// sass{compile scss entry points file in css} =>
// sourcemaps{creating sourcemaps for entry point files} =>
// gulpIgnore{filter files}
// ]
function sourceMapAsset() {
	const condition = localSettings.sourcemapsFiles;
	return src([`${localSettings.sourceFolder}${localSettings.nativeScssEntryPoint}`,`${localSettings.sourceFolder}${localSettings.bootstrapScssEntryPoint}`])
	.pipe(sourcemaps.init())
	.pipe(sass({outputStyle: localSettings.sassCompilerOutputType}).on('error', sass.logError))
	.pipe(sourcemaps.write('.'))
	.pipe(gulpIgnore.include(condition))
	.pipe(dest(`${localSettings.distFolder}/css`));
}

//function imageAssets: function for moving and minification images from src to dist folder
// Info: by default my system doesn't support webp convering
// [
// imagemin{minification images} =>
// ]
function imageAssets() {
	return src(`${localSettings.sourceFolder}/img/**/*`)
    .pipe(imagemin([
    imagemin.mozjpeg({quality: 75, progressive: true}),
    imagemin.optipng({optimizationLevel: 5}),
    imagemin.svgo({
        plugins: [
            {removeViewBox: true},
            {cleanupIDs: false}
        ]
    })
	]))
    .pipe(dest(`${localSettings.distFolder}/img`));
}

// function jsAsset: function for bundling js libraries
// Info: at preset this function is not included into build tast
function jsAsset() {
	return src(`${localSettings.sourceFolder}/libs/bootstrap5/js/bootstrap.js`)
	.pipe(sourcemaps.init())
	.pipe(concat('bundle.js'))
	 .pipe(sourcemaps.write(''))
	.pipe(dest(`${localSettings.distFolder}/js`));
}

//function browserAutoSync: function which create localserver and start watching for assets
function browserAutoSync() {
	browserSync.init({
        server: {
            baseDir: `./${localSettings.baseDir}`,
            port: localSettings.serverPort
        }
    });
    assetsWatch();
}

//function assetsWatch: function for watching assets in project
function assetsWatch() {
	watch([`${localSettings.sourceFolder}/index.pug`,`${localSettings.sourceFolder}${localSettings.nativePug}`],htmlAsset).on('change', browserSync.reload);
	watch([`${localSettings.sourceFolder}${localSettings.nativeScss}`],series(cssAsset,sourceMapAsset));
	watch([`${localSettings.sourceFolder}/img/**/*`],imageAssets);
}

// function for clear dist folder with compiled project files
function clearDistFolder() {
	return src(`${localSettings.distFolder}`)
        .pipe(clean({force: true}))
        .pipe(dest('./'));
}

module.exports.build = series(clearDistFolder,series(cssAsset,sourceMapAsset),imageAssets,htmlAsset,browserAutoSync);
module.exports.htmlAsset = htmlAsset;
module.exports.cssAsset = cssAsset;
module.exports.imageAssets = imageAssets;
module.exports.jsAsset = jsAsset;
module.exports.sourceMapAsset = sourceMapAsset;
module.exports.assetsWatch = assetsWatch;
module.exports.browserAutoSync = browserAutoSync;
module.exports.clearDistFolder = clearDistFolder;

