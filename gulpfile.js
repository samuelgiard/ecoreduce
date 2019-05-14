/* ************* */
/*   PACKAGES    */
/* ************* */

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

/* ************* */
/*     PATHS     */
/* ************* */

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

/* ************* */
/*     RESET     */
/* ************* */

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

function resetvpm() {
    clean();
    gulp.src(paths.htmlfiles.src)
        .pipe(gulp.dest(paths.htmlfiles.temp_dest));
    return gulp.src('reset.css')
        .pipe(gulp.dest(paths.cssfiles.temp_dest));
}

/* ************* */
/*    IMAGES     */
/* ************* */

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

/* ************* */
/*     STYLE     */
/* ************* */

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

// Purge CSS by selecting applied classes in HTML
function csspurge() {
    return gulp.src('styles.css')
        .pipe(purgecss({
            content: [paths.htmlfiles.temp_src]
        }))
        .pipe(gulp.dest(paths.cssfiles.temp_dest));
}

// Minify CSS
function minCSS() {
    return gulp.src(paths.cssfiles.temp_src)
        .pipe(minifycss())
        .pipe(gulp.dest(paths.cssfiles.dest));
}

// insert minified CSS in template
function insertCSS() {
    return gulp.src(paths.htmlfiles.src)
        .pipe(template({styles: fs.readFileSync('output/bundle.css')}))
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

/* ************* */
/*     HTML      */
/* ************* */

function minifyvpi() {
    return gulp.src(paths.htmlfiles.temp_src)
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true, ignorePath: '/assets' }))
        .pipe(removeEmptyLines())
        .pipe(replace('<br', ' <br'))
        .pipe(gulp.dest(paths.htmlfiles.dest));
}

function minifyvpm() {
    return gulp.src(paths.htmlfiles.temp_src)
        .pipe(htmlmin({collapseWhitespace: false, removeComments: true, ignorePath: '/assets' }))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(paths.htmlfiles.dest))
}

/* ************* */
/*      ZIP      */
/* ************* */

function compress() {
    return gulp.src(paths.zipfiles.src)
        .pipe(zip('ecoreduced.zip'))
        .pipe(gulp.dest(paths.zipfiles.temp_dest))
}

// remove css from final zip
function cleanzip() {
    return del(['output/*.css']);
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

/* ************* */
/*     TASKS     */
/* ************* */

// Reset
exports.clean = clean;
exports.resetvpi = resetvpi;
exports.resetvpm = resetvpm;
// Images
exports.images = images;
// Style
exports.styles = styles;
exports.csspurge = csspurge;
exports.minCSS = minCSS;
exports.insertCSS = insertCSS;
exports.noCSS = noCSS;
exports.cssconcat = cssconcat;
// HTML
exports.minifyvpi = minifyvpi;
exports.minifyvpm = minifyvpm;
// ZIP
exports.compress = compress;
exports.cleanzip = cleanzip;
exports.renamezip = renamezip;

var vpm = gulp.series(clean, resetvpm, gulp.parallel(images, csspurge), cssconcat, insertCSS, minifyvpm, cleanzip, compress, renamezip);
var vpi = gulp.series(clean, resetvpi, csspurge, cssconcat, minifyvpi);

gulp.task('default', console.log("NOTICE: Use 'gulp vpm' for Cabestan and 'gulp vpi' for Neolane."));
gulp.task('vpm', vpm);
gulp.task('vpi', vpi);