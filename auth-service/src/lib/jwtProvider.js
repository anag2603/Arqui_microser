// Con USE_MOCKS=true usa los mocks; si no, el módulo real de Adalid
module.exports =
  process.env.USE_MOCKS === 'true'
    ? require('./jwtMock')
    : require('../../../shared/jwt');