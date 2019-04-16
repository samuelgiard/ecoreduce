var gulp = require('gulp');
var htmlmin = require('gulp-html-minifier');
var del = require('del');
var fs = require('fs');
var template = require('gulp-template');
var minifycss = require('gulp-clean-css');
var purifycss =  require('gulp-purifycss');

// Image compression
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');

// paths declaration
var paths = {
    htmlfile: {
        src: 'input/**/*.html',
        dest: 'output',
        temporary_src: 'temporary/**/*.html',
        temporary_dest: 'temporary'
    },
    imagefile: {
        src: 'input/**/*.{png,jpeg,jpg,svg,gif}',
        dest: 'output'
    },
    styles: {
        src: 'input/**/*.css',
        dest: 'output',
        temporary_src: 'temporary/**/*.css',
        temporary_dest: 'temporary'
    }
};

// Reset
function clean() {
    return del(['output/**', 'temporary/**']);
}

// Images
function images() {
    return gulp.src(paths.imagefile.src)
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
        .pipe(gulp.dest(paths.imagefile.dest))
}

// Styles
function styles() {
    return gulp.src(paths.styles.src)
        .pipe(purifycss(
            [paths.htmlfile.src],
            {
                info: true,
                minify: false,
                rejected: false,
                whitelist: ['*xternal*', '*apple*', '*outlook*']
            }))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.styles.temporary_dest));
}

// Minify HTML
function minify() {
    return gulp.src(paths.htmlfile.temporary_src)
        .pipe(htmlmin({collapseWhitespace: true, ignorePath: '/assets' }))
        .pipe(gulp.dest(paths.htmlfile.dest))
}

// insert CSS in template
function insertCSS() {
    return gulp.src(paths.htmlfile.src)
        .pipe(template({styles: fs.readFileSync('temporary/styles.css')}))
        .pipe(gulp.dest(paths.htmlfile.temporary_dest));
}

exports.clean = clean;
exports.images = images;
exports.styles = styles;
exports.minify = minify;
exports.insertCSS = insertCSS;

// var build = gulp.series(clean, gulp.parallel(images, styles, minify), insertCSS);
var build = gulp.series(clean, images, styles, insertCSS, minify);
gulp.task('default', build);