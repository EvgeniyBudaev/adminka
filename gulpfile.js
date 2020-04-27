let gulp = require('gulp'),
  sass = require('gulp-sass'),
  rename = require('gulp-rename'),
  browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  cssmin = require('gulp-cssmin'),
  webpack = require('webpack-stream'),
  autoprefixer = require('gulp-autoprefixer'),
  cleanCSS = require('gulp-clean-css'),
  postcss = require('gulp-postcss');


const dist = "app/admin";
const prod = "./build/";

gulp.task('sass', function () {
  return gulp.src('app/scss/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 8 versions']
    }))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('style', function () {
  return gulp.src([
    'node_modules/normalize.css/normalize.css',
    'node_modules/slick-carousel/slick/slick.css',
    'node_modules/magnific-popup/dist/magnific-popup.css',
    'node_modules/rateyo/src/jquery.rateyo.css',
    'node_modules/ion-rangeslider/css/ion.rangeSlider.css',
    'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.css',
    'node_modules/jquery-form-styler/dist/jquery.formstyler.css',
    'node_modules/jquery-form-styler/dist/jquery.formstyler.theme.css'
  ])
    .pipe(concat('libs.min.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('app/css'))
});

gulp.task('script', function () {
  return gulp.src([
    'node_modules/slick-carousel/slick/slick.js',
    'node_modules/magnific-popup/dist/jquery.magnific-popup.js',
    'node_modules/mixitup/dist/mixitup.js',
    'node_modules/rateyo/src/jquery.rateyo.js',
    'node_modules/ion-rangeslider/js/ion.rangeSlider.js',
    'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
    'node_modules/jquery-form-styler/dist/jquery.formstyler.js'
  ])
    .pipe(concat('libs.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('app/js'))
});

gulp.task('html', function () {
  return gulp.src('app/*.html')
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('copy-html', function () {
  return gulp.src('app/*.html')
    .pipe(gulp.dest(dist))
});

gulp.task('build-sass', function () {
  return gulp.src('app/scss/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 8 versions']
    }))
    .pipe(gulp.dest('app/admin/css'))
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('build-js', function () {
  return gulp.src('app/js/*.js')
    .pipe(webpack({
      mode: 'development',
      output: {
        filename: 'main.js'
      },
      watch: false,
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', {
                  debug: true,
                  corejs: 3,
                  useBuiltIns: "usage"
                }], "@babel/react"]
              }
            }
          }
        ]
      }
    }))
    .pipe(gulp.dest("app/admin/js"))
});

gulp.task('js', function () {
  return gulp.src('app/js/*.js')
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('copy-api', () => {
  return gulp.src('app/api/**/*.*')
    .pipe(gulp.dest('app/admin/api'))
});

gulp.task('copy-assets', function () {
  return gulp.src('app/assets/**/*.*')
    .pipe(gulp.dest('app/admin/assets'))
});

gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: "app/"
    }
  });
});

gulp.task('watch', function () {
  gulp.watch('app/scss/**/*.scss', gulp.parallel('sass'))
  gulp.watch('app/*.html', gulp.parallel('html'))
  gulp.watch('app/js/*.js', gulp.parallel('js'))
  gulp.watch('app/*.html', gulp.parallel('copy-html'))
  gulp.watch('app/js/*.js', gulp.parallel('build-js'))
  gulp.watch('app/scss/**/*.scss', gulp.parallel('build-sass'))
  gulp.watch('app/api/**/*.*', gulp.parallel('copy-api'))
  gulp.watch('app/assets/**/*.*', gulp.parallel('copy-assets'))
});

gulp.task('build', gulp.parallel('sass', 'html', 'js', 'copy-html', 'build-js', 'build-sass', 'copy-api', 'copy-assets'))

gulp.task("prod", () => {
  gulp.src('./app/*.html')
    .pipe(gulp.dest(prod))
  gulp.src('./app/api/**/.*')
    .pipe(gulp.dest(prod + '/api'))
  gulp.src('./app/api/**/*.*')
    .pipe(gulp.dest(prod + '/api'))
  gulp.src('./app/assets/**/*.*')
    .pipe(gulp.dest(prod + '/assets'))

  gulp.src('./app/js/main.js')
    .pipe(webpack({
      mode: 'production',
      output: {
        filename: 'main.js'
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', {
                  debug: false,
                  corejs: 3,
                  useBuiltIns: "usage"
                }], "@babel/react"]
              }
            }
          }
        ]
      }
    }))
    .pipe(gulp.dest(prod));

  return gulp.src('./app/scss/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS())
    .pipe(gulp.dest(prod))
});

gulp.task('default', gulp.parallel('style', 'script', 'sass', 'watch', 'browser-sync', 'build'))

// gulp.task('default', gulp.parallel('watch', 'build'))