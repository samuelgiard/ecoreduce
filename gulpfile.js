var gulp = require('gulp');
var htmlmin = require('gulp-html-minifier');
var del = require('del');
var path = require('path');
var fs = require('fs');
var template = require('gulp-template');
var minifycss = require('gulp-clean-css');
var purifycss =  require('gulp-purifycss');
var zip = require('gulp-zip');
var rename = require('gulp-rename');

// Image compression
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');

// paths declaration
var paths = {
    htmlfiles: {
        src: 'input/**/*.html',
        dest: 'output',
        temporary_src: 'temporary/**/*.html',
        temporary_dest: 'temporary'
    },
    imagefiles: {
        src: 'input/**/*.{png,jpeg,jpg,svg,gif}',
        dest: 'output'
    },
    styles: {
        src: 'styles.css',
        dest: 'output',
        temporary_src: 'temporary/**/*.css',
        temporary_dest: 'temporary'
    },
    zipfiles: {
        src: 'output/**/*',
        dest: 'publish',
        temporary_src: 'temporary/*.zip',
        temporary_dest: 'temporary'
    }
};

// Reset
function clean() {
    return del(['output/**', 'temporary/**']);
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
    return gulp.src(paths.styles.src)
        .pipe(purifycss(
            [paths.htmlfiles.src],
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
    return gulp.src(paths.htmlfiles.temporary_src)
        .pipe(htmlmin({collapseWhitespace: true, ignorePath: '/assets' }))
        .pipe(gulp.dest(paths.htmlfiles.dest))
}

// insert CSS in template
function insertCSS() {
    return gulp.src(paths.htmlfiles.src)
        .pipe(template({styles: fs.readFileSync('temporary/styles.css')}))
        .pipe(gulp.dest(paths.htmlfiles.temporary_dest));
}

// zip the files
function compress() {
    return gulp.src(paths.zipfiles.src)
        .pipe(zip('ecoreduced.zip'))
        .pipe(gulp.dest(paths.zipfiles.temporary_dest))
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

    return gulp.src(paths.zipfiles.temporary_src, { base: process.cwd()})
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
exports.minify = minify;
exports.insertCSS = insertCSS;
exports.compress = compress;

// var build = gulp.series(clean, gulp.parallel(images, styles, minify), insertCSS);
var build = gulp.series(clean, images, styles, insertCSS, minify, compress, renamezip);
var compress = gulp.parallel(compress);
var css = gulp.series(insertCSS);
gulp.task('default', build);
gulp.task('compress', compress);
gulp.task('css', css);
gulp.task('renamezip', renamezip);