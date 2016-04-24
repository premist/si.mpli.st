const child_process = require("child_process");

const gulp = require("gulp");
const htmlmin = require("gulp-htmlmin");
const postcss = require("gulp-postcss");
const connect = require("gulp-connect");
const browserSync = require("browser-sync").create();


const base_path = "./";
const paths = {
  base: "./",
  static: {
    src: `${base_path}_static`,
    dest: `${base_path}assets`
  },
  watch: {
    jekyll: [
      `${base_path}index.html`,
      `${base_path}_posts/*`,
      `${base_path}_layouts/*`,
      `${base_path}_includes/*`,
      `${base_path}_static/**/*.css`,
    ],
    css: [
      `${base_path}_static/**/*.css`,
    ]
  }
};

gulp.task("css", () => {
  return (
    gulp.src(`${paths.static.src}/css/*.css`)
    .pipe(postcss([
      require("postcss-cssnext")(),
      require("cssnano")({ autoprefixer: false }),
      require("postcss-reporter")()
    ]))
    .pipe(gulp.dest(`${paths.static.dest}/css`))
  );
});

// http://blog.webbb.be/use-jekyll-with-gulp/
gulp.task("jekyll", ["css"], (cb) => {
  return child_process.spawn("bundle", ["exec", "jekyll", "build"], {stdio: "inherit"})
                      .on("error", (error) => console.log(`Error on Jekyll: ${error}`))
                      .on("close", (code) => {
                        browserSync.reload();
                        cb(code);
                      });
});

gulp.task("watch", () => {
  gulp.watch(paths.watch.jekyll, ["jekyll"]);
  gulp.watch(paths.watch.css, ["css"]);
});

gulp.task("browser-sync", () => {
  browserSync.init({
    server: {
      baseDir: `${paths.base}_site`
    }
  });
});

gulp.task("default", ["css", "jekyll", "browser-sync", "watch"]);
gulp.task("build", ["css", "jekyll"]);
