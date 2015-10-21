var gulp = require("gulp");
var pkg = require("./package.json");
var uglify = require("gulp-uglify");
var minifycss = require('gulp-minify-css');
var del = require('del');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var header = require('gulp-header');

var banner = ['/**',
	' * <%= name %> - <%= description %>',
	' * @version v<%= version %>',
	' * @link <%= homepage %>',
	' * @author <%= author %>',
	' * @license <%= license %>',
	' */',
	''
].join('\r\n');

gulp.task('clear', function(cb) {
	del(['build'], cb);
});

gulp.task('build', ["clear"], function() {
	//css
	gulp.src(["./src/**/*.css"])
		.pipe(minifycss())
		.pipe(header(banner, pkg))
		.pipe(gulp.dest("./build/"));
	//js
	gulp.src(["./src/**/*.js"])
		.pipe(uglify({
			mangle: {
				except: ['require']
			}
		}))
		.pipe(header(banner, pkg))
		.pipe(gulp.dest("./build/"));
	//html
	gulp.src(["./src/**/*.html"])
		.pipe(gulp.dest("./build/"));
	//ttf
	gulp.src(["./src/**/*.ttf"])
		.pipe(gulp.dest("./build/"));
	//otf
	gulp.src(["./src/**/*.otf"])
		.pipe(gulp.dest("./build/"));
	//eot
	gulp.src(["./src/**/*.eot"])
		.pipe(gulp.dest("./build/"));
	//woff
	gulp.src(["./src/**/*.woff"])
		.pipe(gulp.dest("./build/"));
	//woff2
	gulp.src(["./src/**/*.woff2"])
		.pipe(gulp.dest("./build/"));
	//svg
	gulp.src(["./src/**/*.svg"])
		.pipe(gulp.dest("./build/"));
	//ico
	gulp.src(["./src/**/*.ico"])
		.pipe(gulp.dest("./build/"));
	//png
	gulp.src(["./src/**/*.png"])
		.pipe(gulp.dest("./build/"));
	//json
	gulp.src(["./src/**/*.json"])
		.pipe(gulp.dest("./build/"));
});

gulp.task('default', ["clear", "build"]);