/** @type {import('npm-check-updates').RcOptions} */
export default {
  doctor: true,
  doctorTest: "npm run validate",

  target: "semver",
  upgrade: true,

  cooldown: name => {
    if(name === "@schoero/configs"){
      return 0;
    }
    return 1;
  }
};
