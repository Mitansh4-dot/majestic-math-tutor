var GA_MEASUREMENT_ID = "G-05SW7W5SPT";

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag("js", new Date());
gtag("config", GA_MEASUREMENT_ID);

(function () {
  var googleScript = document.createElement("script");
  googleScript.async = true;
  googleScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(googleScript);
})();
