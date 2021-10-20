'use strict';

// Подключаем все необходимые плагины
const gulp = require( 'gulp' );                       // Сам сборщик Gulp
const sass = require( 'gulp-sass' );                  // Компиляция SASS/SCSS
const mmq = require( 'gulp-merge-media-queries' );   // Соединение медиа-запросов
const browserSync = require( 'browser-sync' );               // Запуск локального сервера
const babel = require( 'gulp-babel' );                 // Транспиляция ES6 в ES5
const sourcemaps = require( 'gulp-sourcemaps' );            // Sourcemap'ы к файлам
const cssnano = require( 'gulp-cssnano' );               // Минификация файлов CSS
const rename = require( 'gulp-rename' );                // Переименовывание файлов
const critical = require( 'critical' ).stream;            // Создание критических стилей
const del = require( 'del' );                        // Удаление файлов директории
const imagemin = require( 'gulp-imagemin' );              // Минификация изображений (в зависимостях также идут дополнительные пакеты)
const cache = require( 'gulp-cache' );                 // Работа с кэшом
const autoprefixer = require( 'gulp-autoprefixer' );          // Расстановка вендорных перфиксов
const plumber = require( 'gulp-plumber' );             // Предотвращение разрыв pipe'ов, вызванных ошибками gulp-плагинов
const notify = require( 'gulp-notify' );                // Вывод уведомления
const fiber = require( 'fibers' );                       // Ускорение обработки стилей
const svgSprite = require( 'gulp-svg-sprite' );
const imageminJpeg = require( 'imagemin-jpegtran' );
const imageminPng = require( 'imagemin-optipng' );
const imageminGif = require( 'imagemin-gifsicle' );
const imageminWebp = require( 'imagemin-webp' );
const imageminSvgo = require( 'imagemin-svgo' );
const webp = require('gulp-webp');
const size = require('gulp-size');
const replace = require( 'gulp-replace' );
const fs = require( 'fs' );                              // Работа с файловой структурой
const log = require( 'fancy-log' );

const postcss = require('gulp-postcss');                // Работа с стилями
const postcssImport = require('postcss-import');        // Работа импортами в css
const posthtml = require('gulp-posthtml');              // Работа с HTML
const posthtmlWebp = require('posthtml-webp');          // Преобразования <img src="" alt=""> в конструкцию  <picture><source type="image/webp" srcset=""> <img src="" alt=""></picture>
const beautify = require('posthtml-beautify');          // Преоброзование HTML

const pug = require('gulp-pug');

const rigger = require('gulp-rigger');                   // модуль для импорта содержимого одного файла в другой
const uglify = require('gulp-uglify');                  // модуль для минимизации JavaScript

const src = './src';                              // Рабочая папка
const build = './build';                          // Продакшен версия проекта


const jpgOptions = {
	progressive: true,
	max: 100,
	size: '60%',
	stripAll: true,
	stripCom: true,
	stripExif: true,
	stripIptc: true,
	stripIcc: true,
	stripXmp: true,
} // Настройка оптимизации формата JPG

const webpOptions = {
	preset: 'default',
	quality: 75,
	alphaQuality: 50,
	method: 4,
	sns: 80,
	filter: 0,
	autoFilter: true,
	sharpness: 0,
	nearLossless: 100,
	metadata: 'none',
}; // Настройка оптимизации формата WEBP

const svgOptions = [
	{ removeDoctype: true },
	{ removeXMLProcInst: true },
	{ removeComments: true },
	{ removeMetadata: true },
	{ removeXMLNS: true },
	{ removeEditorsNSData: true },
	{ cleanupAttrs: true },
	{ inlineStyles: true },
	{ minifyStyles: true },
	{ convertStyleToAttrs: true },
	{ cleanupIDs: true },
	{ removeRasterImages: false },
	{ removeUselessDefs: true },
	{ cleanupNumericValues: true },
	{ cleanupListOfValues: false },
	{ convertColors: true },
	{ removeUnknownsAndDefaults: true },
	{ removeNonInheritableGroupAttrs: true },
	{ removeUselessStrokeAndFill: true },
	{ removeViewBox: false },
	{ cleanupEnableBackground: true },
	{ removeHiddenElems: true },
	{ removeEmptyText: true },
	{ convertShapeToPath: true },
	{ moveElemsAttrsToGroup: true },
	{ moveGroupAttrsToElems: true },
	{ collapseGroups: true },
	{ convertPathData: true },
	{ convertTransform: true },
	{ convertEllipseToCircle: true },
	{ removeEmptyAttrs: true },
	{ removeEmptyContainers: true },
	{ mergePaths: true },
	{ removeUnusedNS: false },
	{ reusePaths: false },
	{ sortAttrs: true },
	{ sortDefsChildren: true },
	{ removeTitle: true },
	{ removeDesc: true },
	{ removeDimensions: false },
	{ removeStyleElement: false },
	{ removeScriptElement: false },
]; // Настройка оптимизации формата SVG

// Компилируем SASS (можно изменить на SCSS) в CSS с минификацией и добавляем вендорные префиксы
gulp.task( 'styles', () => {
	return gulp.src( `${ src }/styles/**/*.scss` )    // в этом файле хранятся основные стили, остальные следует импортировать в него
		.pipe( sourcemaps.init() )                    // инциализация sourcemap'ов
		.pipe( sass( {
			outputStyle: ':nested',                    // компиляции в CSS с отступами
			includePaths: ['src/styles/', 'node_modules/', 'node_modules/foundation-sites/scss'],  // Где искать стили
			fiber: fiber,
		} ) )
		.on( 'error', notify.onError( {
			title: 'SASS',
			message: '<%= error.message %>'           // вывод сообщения об ошибке
		} ) )
		.pipe(autoprefixer({
			// cascade: true,
			// remove: true
			// grid: "autoplace",
			cascade: false,
			grid: true,
			overrideBrowserslist: [
				"last 2 version",
				"not dead",
				"not ie <= 11"
			]
		}))                    // настройка автоматической подстановки вендорных префиксов)
		.pipe( mmq() )                                // собираем все медиа запросы
		.pipe( sourcemaps.write() )                   // запись sourcemap'ов
		.pipe( gulp.dest( `${ src }/css/` ) )         // путь вывода файла
		.pipe( browserSync.reload( {
			stream: true                              // инжектим стили без перезагрузки страницы
		} ) );
} );

// Generate & Inline Critical-path CSS - для билд версии проекта
gulp.task('critical', () => {
	return gulp.src(`${ src }/index.html`)
		.pipe(replace(/<link href=".\/css\/critical.css"[^>]*>/, function(s) {
			var style = fs.readFileSync(`${ build }/css/critical.min.css`, 'utf8');
			return '<style>\n' + style + '\n</style>';
		}))
		.on('error', err => {
			log.error(err.message);
		})
		.pipe(gulp.dest(`${ build }/`));
});

// Таск SASS для продакшена, без sourcemap'ов
gulp.task( 'styles_build', () => {
	return gulp.src( `${ src }/styles/*.scss` )
		.pipe( sass( {
			outputStyle: ':nested',                    // компиляции в CSS с отступами
			includePaths: ['src/styles/', 'node_modules/', 'node_modules/foundation-sites/scss'],  // Где искать стили
			fiber: fiber,
		} ) )
		.pipe(autoprefixer({
			// cascade: true,
			// remove: true
			// grid: "autoplace",
			cascade: false,
			grid: true,
			overrideBrowserslist: [
				"last 2 version",
				"not dead",
				"not ie <= 11"
			]
		}))
		.pipe( mmq() )
		.pipe( cssnano() )
		.pipe( rename( {
			suffix: '.min'
		} ) )
		.pipe( gulp.dest( `${ build }/css` ) );

} );

// Компилируем tailwindcss стили
gulp.task('tailwindcss', function () {
	return gulp.src(`${ src }/styles/tailwindcss.css`)
		.pipe(postcss([
			postcssImport(),
			require('tailwindcss')
		]))
		.pipe(gulp.dest(`${ src }/css/`));
})
gulp.task('tailwindcss_build', function () {
	return gulp.src(`${ src }/styles/tailwindcss.css`)
		.pipe(postcss([
			postcssImport(),
			require('tailwindcss')
		]))
		.pipe(gulp.dest(`${ build }/css/`));
})

// Минифицируем изображения и кидаем их в кэш
gulp.task( 'images', () => {
	return gulp.src( `${ src }/images/**/*` )                 // путь ко всем изображениям
		.pipe( cache( imagemin( [                      // сжатие изображений без потери качества
			imageminGif({
				interlaced: true,
				optimizationLevel: 3,
				colors: 256
			}),                                    // сжатие gif
			imageminJpeg( { jpgOptions } ),                   // сжатие jpeg
			imageminPng(),                                    // сжатие png
			imageminWebp( { webpOptions } ), 		  // сжатие webp
			imageminSvgo( { plugins: svgOptions } )    // сжатие svg
		] ) ) )
		.pipe(size({ title: '[images]' }))
		.pipe( gulp.dest( `${ build }/images` ) );            // путь вывода файлов
} );

// Конвертируем JPG,PNG to WEBP
gulp.task( 'webp_images', () => {
	return gulp.src( `${ src }/images/**/*.{jpg,png}` )                 // путь ко всем изображениям
		.pipe( cache(
			webp({ webpOptions })
		) )
		.pipe( gulp.dest( `${ src }/images` ) );            // путь вывода файлов
} );

// Создания SVG спрайт
gulp.task( 'sprites', () => {
	return gulp.src( `${ src }/images/sprite_src/sprites/**/*.svg`)
		.pipe( svgSprite( {
			shape: {
				id: {
					separator: '-',
					generator: 'svg-%s' // Генерация класса для иконки svg-name-icon
				},
			},
			mode: {
				symbol: {
					dest: '',
					sprite: `./images/sprite_src/sprite.svg`, // Генерация файла svg
					inline: true,
					render: {
						scss: {
							template: './config/sprite/tmpl_scss.mustache', // Настройка стилей для спрайта
							dest: `./styles/_sprites/` // Генерация файла стилей для спрайта
						}
					}
				}
			},
			variables: { // Базовая настройка
				baseFz: 20,
				prefixStatic: 'svg-'
			}
			} ) )
		.pipe( gulp.dest( `${ src }/` ) );
} );
gulp.task( 'sprites_build', () => {
	return gulp.src( `${ build }/images/sprite_src/sprites/**/*.svg`)
		.pipe( svgSprite( {
			shape: {
				id: {
					separator: '-',
					generator: 'svg-%s' // Генерация класса для иконки svg-name-icon
				},
			},
			mode: {
				symbol: {
					dest: '',
					sprite: `./images/sprite_src/sprite.svg`, // Генерация файла svg
					inline: true,
					render: {
						scss: {
							template: './config/sprite/tmpl_scss.mustache', // Настройка стилей для спрайта
							dest: `./styles/_sprites/` // Генерация файла стилей для спрайта
						}
					}
				}
			},
			variables: { // Базовая настройка
				baseFz: 20,
				prefixStatic: 'svg-'
			}
		} ) )
		.pipe( gulp.dest( `${ build }/` ) );
} );

// Generate & Inline SVG спрайт
gulp.task('svg_inline', () => {
	return gulp.src(`${ src }/index.html`)
		.pipe(replace(/<div id="svg_inline">(?:(?!<\/div>)[^])*<\/div>/g, () => {    // Поиск div с id svg_inline для того что бы вставить содержимое файла ./images/sprite_src/sprite.svg
			const svgInline = fs.readFileSync(`${ src }/images/sprite_src/sprite.svg`, 'utf8');  // Открываем файл
			return '<div id="svg_inline">\n' + svgInline + '\n</div>';          // Вставляем в div с id svg_inline содержимое файла ./images/sprite_src/sprite.svg
		}))
		.on('error', err => {
			log.error(err.message);
		})
		.pipe(gulp.dest(`${ src }/`));
});
gulp.task('svg_inline_build', () => {
	return gulp.src(`${ src }/index.html`)
		.pipe(replace(/<div id="svg_inline">(?:(?!<\/div>)[^])*<\/div>/g, () => {      // Поиск div с id svg_inline для того что бы вставить содержимое файла ./images/sprite_src/sprite.svg
			const svgInline = fs.readFileSync(`${build}/images/sprite_src/sprite.svg`, 'utf8');      // Открываем файл
			return '<div id="svg_inline">\n' + svgInline + '\n</div>';       // Вставляем в div с id svg_inline содержимое файла ./images/sprite_src/sprite.svg
		}))
		.on('error', err => {
			log.error(err.message);
		})
		.pipe(gulp.dest(`${ build }`));
});

// Запускаем наш локальный сервер
gulp.task( 'browserSync', () => {
	browserSync( {
		server: {
			baseDir: `${ src }/`                               // корневая папка для запускаемого проекта
		},
		notify: false                                         // отключаем стандартные уведомления browsersync
	} );
} );

// Преобразования <img src="" alt=""> в конструкцию  <picture><source type="image/webp" srcset=""> <img src="" alt=""></picture>
gulp.task('htmlWebp', () => {
	return gulp.src(`${ build }/*.html`)
		.pipe(posthtml([
			posthtmlWebp({
				replaceExtension: true,   // Замените расширение исходного изображения на .webp вместо добавления .webp к исходному имени файла Пример:image.jpg => image.webp (instead of image.jpg.webp)
				extensionIgnore: ["svg", "gif", "webp"],   // список расширений, для которых преобразование будет игнорироваться
				classIgnore: ["ignore-webp"],  // список классов, для которых преобразование будет игнорироваться
			})
		]))
		.pipe(gulp.dest(`${ build }/`));
});

// Конвертируем PUG в HTML
gulp.task('pug', () => {
	return gulp.src(`${ src }/view/*.pug`)
		.pipe(plumber({
			errorHandler: notify.onError(err => ({
				title: 'pug',
				message: err.message
			}))
		})) // Window notification
		.pipe(pug({
			pretty: false,
		}))                     // Компилируем pug
		.on('error', notify.onError(function(error) {
			return {
				title: 'Pug',
				message: error.message
			};
		}))
		.pipe(posthtml([
			beautify({
				rules: { indent: 'tab', blankLines: '', sortAttr: true,}
			})
		]))
		.pipe(gulp.dest(`${ src }/`))
		.pipe(browserSync.reload({
			stream: true
		}))
});
// Конвертируем PUG в HTML для продакшина
gulp.task('pug_build', () => {
	return gulp.src(`${ src }/view/*.pug`)
		.pipe(plumber({
			errorHandler: notify.onError(err => ({
				title: 'pug',
				message: err.message
			}))
		})) // Window notification
		.pipe(pug({
			pretty: true,
		}))                     // Компилируем pug
		.on('error', notify.onError(function(error) {
			return {
				title: 'Pug',
				message: error.message
			};
		}))
		.pipe(posthtml([
			beautify({
				rules: { indent: 'tab', blankLines: ' ', sortAttr: true,}
			})
		]))
		.pipe(gulp.dest(`${ build }/`))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Обработка javaScript файлов
gulp.task('js', () => {
	return  gulp.src(`${ src }/javaScript/**.js`) // получим файл main.js
		.pipe(plumber({
			errorHandler: notify.onError(err => ({
				title: 'javaScript',
				message: err.message
			}))
		})) // для отслеживания ошибок
		.pipe(rigger())          // импортируем все указанные файлы в main.js
		.pipe(babel())                       // Транспиляция ES6 в ES5
		.on('error', notify.onError(function(error) {
			return {
				title: 'javaScript',
				message: error.message
			};
		}))
		.pipe(sourcemaps.init())                //инициализируем sourcemap
		.pipe(uglify())                         // минимизируем js
		.pipe( rename( {
			suffix: '.min'
		} ) )                                   // Переименовываем файл name-file.min.js
		.pipe(sourcemaps.write('./'))   //  записываем sourcemap
		.pipe(gulp.dest(`${ src }/js/`))        // положим готовый файл
		.pipe( browserSync.reload( {
			stream: true                              // инжектим стили без перезагрузки страницы
		} ) ); // перезагрузим сервер
});
// Обработка javaScript файлов
gulp.task('js:build', () => {
	return  gulp.src(`${ src }/javaScript/**.js`) // получим файл main.js
		.pipe(plumber({
			errorHandler: notify.onError(err => ({
				title: 'javaScript',
				message: err.message
			}))
		}))                 // для отслеживания ошибок
		.pipe(rigger())          // импортируем все указанные файлы в main.js
		.pipe(babel())                       // Транспиляция ES6 в ES5
		.on('error', notify.onError(function(error) {
			return {
				title: 'javaScript',
				message: error.message
			};
		}))
		.pipe(uglify())                         // минимизируем js
		.pipe( rename( {
			suffix: '.min'
		} ) )                                   // Переименовываем файл name-file.min.js
		.pipe(gulp.dest(`${ build }/js/`));      // положим готовый файл
});
// Копируем файлы библиотек
gulp.task('js:move', () => {
	return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js', 'node_modules/jquery/dist/jquery.min.js'])
		.pipe(gulp.dest(`${ src }/js/`)) // положим готовый файл
		.pipe( browserSync.reload( {
			stream: true                              // инжектим стили без перезагрузки страницы
		} ) ); // перезагрузим сервер
});
gulp.task('js:move:build', () => {
	return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js', 'node_modules/jquery/dist/jquery.min.js'])
		.pipe(gulp.dest(`${ build }/js/`)) // положим готовый файл
		.pipe( browserSync.reload( {
			stream: true                              // инжектим стили без перезагрузки страницы
		} ) ); // перезагрузим сервер
});

// Удаляем все лишние файлы: '.gitkeep', 'changelog.md' и 'readme.md'
gulp.task( 'misc', () => {
	return del.sync( [ '**/.gitkeep', 'changelog.md', 'readme.md' ] );
} );

// Очищаем директорию продакшен билда
gulp.task('clean', async () => {
	return del.sync(`${build}/**/*`);
});

// Чистим кэш изображений (вообще весь кэш)
gulp.task( 'clear', () => {
	return cache.clearAll();
} );

// Следим за изменениями файлов и выполняем соответствующие таски
gulp.task( 'default', gulp.parallel( 'pug', 'styles', 'critical', 'webp_images', 'sprites', 'svg_inline', 'js', 'browserSync', async () => {
	// стили
	gulp.watch( `${ src }/styles/**/*.scss`, gulp.series( 'styles' ) );
	// htlm
	gulp.watch( `${ src }/view/**/*.pug`, gulp.series( 'pug' ) );
	// cпрайт
	gulp.watch( `${ src }/images/sprite_src/sprites/**/*.svg`, gulp.series( 'sprites', 'svg_inline' ) );
	// Cкрипты
	gulp.watch( `${ src }/javaScript/**/*.js`, gulp.series( 'js' ) );
} ) );


// Собираем наш билд в продакшен
gulp.task( 'build', gulp.series( 'clean', 'pug_build', 'webp_images', 'images', 'sprites_build', 'svg_inline_build', 'styles_build', 'critical', 'htmlWebp', 'js:build', async () => {

	// Собираем шрифты
	gulp.src( `${ src }/fonts/**/*` )
		.pipe( gulp.dest( `${ build }/fonts` ) );

} ) );
