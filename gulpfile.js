var gulp = require('gulp');
var audiosprite = require('./vendor/audiosprite');
var glob = require('glob');
var shell = require('gulp-shell');
var fs = require('fs');
var connect = require('gulp-connect');

gulp.task('audio', gulp.parallel(function() {
  var files = glob.sync('./src/assets/sounds/*.mp3');
  var outputPath = './dist/audio';
  var opts = {
    output: outputPath,
    path: './',
    format: 'howler2',
    'export': 'ogg,mp3',
    loop: ['quacking', 'sniff']
  };

  return audiosprite(files, opts, function(err, obj) {
    if (err) {
      console.error(err);
    }

    return fs.writeFile('./dist/audio' + '.json', JSON.stringify(obj, null, 2));
  });
}));

gulp.task('images', gulp.parallel(function(){
  // There is a texturepacker template for spritesmith but it doesn't work
  // well with complex directory structures, so instead we use the shell
  // checking TexturePacker --version first ensures it bails if TexturePacker
  // isn't installed
  return gulp.src('*', {read:false})
    .pipe(shell([
      'TexturePacker --version || echo ERROR: TexturePacker not found, install TexturePacker',
      'TexturePacker --disable-rotation --data dist/sprites.json --format json --sheet dist/sprites.png src/assets/images'
    ]))
    .pipe(connect.reload());
}));

gulp.task('deploy', gulp.parallel(function() {
  return gulp.src('*', {read:false})
    .pipe(shell([
    'AWS_PROFILE=duckhunt terraform plan',
    'AWS_PROFILE=duckhunt terraform apply',
    'aws --profile duckhunt s3 sync dist/ s3://duckhuntjs.com --include \'*\' --acl \'public-read\''
  ]));
}));

gulp.task('default', gulp.parallel('images', 'audio'));
