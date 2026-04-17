module.exports = function (source) {
  return source.replace(/import\.meta/g, "{ url: (typeof CESIUM_BASE_URL !== 'undefined' ? CESIUM_BASE_URL : window.location.href) }");
};
