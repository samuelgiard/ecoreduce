// PACKAGES
var gulp = require('gulp');
// File System
var del = require('del');
var path = require('path');
var fs = require('fs');
var zip = require('gulp-zip');
var rename = require('gulp-rename');
// HTML
var htmlmin = require('gulp-html-minifier');
var removeEmptyLines = require('gulp-remove-empty-lines');
var replace = require('gulp-replace');
var template = require('gulp-template');
// CSS
var minifycss = require('gulp-clean-css');
var purifycss =  require('gulp-purifycss');
var purgecss = require('gulp-purgecss');
var concatCss = require('gulp-concat-css');
// Images
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');

// paths declaration
var paths = {
    htmlfiles: {
        src: 'input/**/*.html',
        dest: 'output',
        temp_src: 'temporary/**/*.html',
        temp_dest: 'temporary'
    },
    imagefiles: {
        src: 'input/**/*.{png,jpeg,jpg,svg,gif}',
        dest: 'output'
    },
    cssfiles: {
        src: 'styles.css',
        dest: 'output',
        temp_src: 'temporary/**/*.css',
        temp_dest: 'temporary'
    },
    zipfiles: {
        src: 'output/**/*',
        dest: 'publish',
        temp_src: 'temporary/*.zip',
        temp_dest: 'temporary'
    }
};

// Reset
function clean() {
    return del(['output/**', 'temporary/**']);
}

function resetvpi() {
    clean();
    gulp.src(paths.htmlfiles.src)
        .pipe(gulp.dest(paths.htmlfiles.temp_dest));
    gulp.src('fixedblocks.html')
        .pipe(gulp.dest(paths.htmlfiles.temp_dest));
    return gulp.src('reset.css')
        .pipe(gulp.dest(paths.cssfiles.temp_dest));
}

// Images
function images() {
    return gulp.src(paths.imagefiles.src)
        .pipe(imagemin(
            [
                imagemin.gifsicle(),
                imagemin.jpegtran(),
                imagemin.optipng(),
                imagemin.svgo(),
                imageminPngquant(),
                imageminJpegRecompress()
            ]
        ))
        .pipe(gulp.dest(paths.imagefiles.dest))
}

// Styles
function styles() {
    return gulp.src(paths.cssfiles.src)
        .pipe(purifycss(
            [paths.htmlfiles.src],
            {
                info: true,
                minify: false,
                rejected: false,
                whitelist: ['*xternal*', '*apple*', '*outlook*']
            }))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.cssfiles.temp_dest));
}

function csspurge() {
    return gulp.src('styles.css')
        .pipe(purgecss({
            content: [paths.htmlfiles.temp_src]
        }))
        .pipe(gulp.dest(paths.cssfiles.temp_dest));
}

// Minify HTML
function minify() {
    return gulp.src(paths.htmlfiles.temp_src)
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true, ignorePath: '/assets' }))
        .pipe(removeEmptyLines())
        .pipe(replace('<br', ' <br'))
        .pipe(gulp.dest(paths.htmlfiles.dest));
}

// Minify CSS
function minCSS() {
    return gulp.src(paths.cssfiles.temp_src)
        .pipe(minifycss())
        .pipe(gulp.dest(paths.cssfiles.dest));
}

function minifywws() {
    return gulp.src(paths.htmlfiles.temp_src)
        .pipe(htmlmin({collapseWhitespace: false, removeComments: true, ignorePath: '/assets' }))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(paths.htmlfiles.dest))
}

// insert CSS in template
function insertCSS() {
    return gulp.src(paths.htmlfiles.src)
        .pipe(template({styles: fs.readFileSync('temporary/styles.css')}))
        .pipe(gulp.dest(paths.htmlfiles.temp_dest));
}

function noCSS() {
    return gulp.src(paths.htmlfiles.src)
        .pipe(gulp.dest(paths.htmlfiles.temp_dest));
}

function cssconcat() {
    return gulp.src(paths.cssfiles.temp_src)
        .pipe(concatCss('bundle.css'))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.cssfiles.dest));
}

// zip the files
function compress() {
    return gulp.src(paths.zipfiles.src)
        .pipe(zip('ecoreduced.zip'))
        .pipe(gulp.dest(paths.zipfiles.temp_dest))
}

// rename the zip file
function renamezip() {
    let files;
    try {
        files = fs.readdirSync('input');
    } catch(err) {
        // An error occurred
        console.error(err);
    }

    return gulp.src(paths.zipfiles.temp_src, { base: process.cwd()})
        .pipe(rename({
            dirname: '.',
            basename: files[1].split('.')[0],
            extname: '.zip'
        }))
        .pipe(gulp.dest(paths.zipfiles.dest));
}

exports.clean = clean;
exports.images = images;
exports.styles = styles;
exports.csspurge = csspurge;
exports.noCSS = noCSS;
exports.cssconcat = cssconcat;
exports.minify = minify;
exports.minifywws = minifywws;
exports.insertCSS = insertCSS;
exports.compress = compress;
exports.renamezip = renamezip;
exports.resetvpi = resetvpi;

// var build = gulp.series(clean, gulp.parallel(images, styles, minify), insertCSS);
var build = gulp.series(clean, images, styles, insertCSS, minify, compress, renamezip);
var vpm = gulp.series(clean, images, styles, insertCSS, minifywws, compress, renamezip);
var vpi = gulp.series(clean, resetvpi, csspurge, cssconcat, minify);

gulp.task('default', vpm);
gulp.task('vpm', vpm);
gulp.task('vpi', vpi);
gulp.task('compress', compress);
gulp.task('build', build);
// gulp.task('renamezip', renamezip);
// gulp.task('csspurge', csspurge);