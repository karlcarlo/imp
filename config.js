module.exports = {
  application: {
    version: 'v0.1.0',
    title: "Investment Management Platform",
    name: "IMP",
    host: '', // http://127.0.0.1/
    port: 3000,
    root_account: 'root@localhost'
  },
  session: {
    secret: "imp"
  },
  database: {
    url: "mongodb://127.0.0.1/imp"
  },
  cookie: {
    name: 'imp'
  },
  allow_image_types: /\.(gif|jpe?g|png)$/i,
  thumbs: {
    s: {
      width: 80,
      height: 60
    },
    m: {
      width: 120,
      height: 90
    },
    b: {
      width: 240,
      height: 160
    },
    l: {
      width: 960
    }
  }
}
