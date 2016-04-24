const child_process = require("child_process");

const gulp = require("gulp");
const htmlmin = require("gulp-htmlmin");
const postcss = require("gulp-postcss");
const connect = require("gulp-connect");


const base_path = "./";
const paths = {
  base: "./",
  static: {
    src: `${base_path}_static`,
    dest: `${base_path}assets`
  },
  watch: [
    `${base_path}_static/**/*.css`,
    'index.html',
    '_posts/*',
    '_layouts/*',
    '_includes/*',
    'assets/*',
    'assets/**/*'
  ]
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
gulp.task("jekyll", (cb) => {
  return child_process.spawn("jekyll", ["build"], {stdio: "inherit"})
                      .on("error", (error) => console.log(`Error on Jekyll: ${error}`))
                      .on("close", cb);
});

gulp.task("server", () => {
  connect.server({
    root: [`${paths.base}_site`],
    port: 4000
  });
});

gulp.task("watch", () => {
  gulp.watch(paths.watch);
});

gulp.task("default", ["css", "jekyll", "server", "watch"]);
