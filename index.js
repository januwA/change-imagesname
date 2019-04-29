const { argv } = require("yargs")
  .config({
    backup: false,
  })
  .usage("$0 dirPath [-b]")
  .option("backup", {
    describe: "是否备份源文件",
    default: false,
    alias: "b",
  });
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
var sha1 = require("sha1");
const l = console.log;

// 是否需要备份源文件
const isBackup = Boolean(argv.backup);
(async function() {
  /**
   * 1. 获取路径
   * 2. 获取路径下所有的图片路径
   * 3. 更改图片名字
   */

  let imagesPath = argv._.length > 0 ? argv._[0] : null;

  // 判断是否输入路径
  if (!imagesPath) {
    return l(chalk.yellow("请输入路径."));
  }

  imagesPath = path.resolve(imagesPath);

  // 判断输入的路径是否存在
  const pathExists = await fse.pathExists(imagesPath);
  if (!pathExists) {
    return l(chalk.red(`${imagesPath}不存在.`));
  }

  // 是否要备份
  if (isBackup) {
    try {
      await fse.copy(imagesPath, `${imagesPath}-backup`);
      console.log("backup success!");
    } catch (er) {
      l(chalk.yellow(er));
    }
  }

  let rpath = [];
  // 递归获取所有图片文件
  gotFileName(imagesPath);

  rpath.forEach(p => {
    const basename = path.basename(p);
    const dirname = path.dirname(p);
    const extname = path.extname(p);
    const newName = path.join(
      dirname,
      `${sha1(basename).slice(0, 8)})_${Date.now().toString(16)}${extname}`,
    );
    fse.rename(p, newName, er => {
      if (er) {
        l(chalk.yellow(er));
      }
    });
  });

  function gotFileName(p) {
    let files = fse.readdirSync(p);
    for (let i = 0; i < files.length; i++) {
      const el = path.join(p, files[i]);
      if (fs.statSync(el).isDirectory()) {
        gotFileName(el);
      } else {
        if (/[\.png|\.jpg|\.gif|\.jpeg]$/i.test(el)) {
          rpath.push(el);
        }
      }
    }
  }
})();
