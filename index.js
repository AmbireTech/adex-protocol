window.onload = function () {
  var root = this.document.getElementById("root");
  var headerHTMLString = this.document.getElementById("header").outerHTML;
  document.getElementById("download").addEventListener("click", () => {
    printJS({
      printable: "root",
      type: "html",
      scanStyles: false,
      showModal: true,
      header: headerHTMLString,
      css: [
        "styles.css",
        "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css",
      ],
    });
  });

  const readme = "./README.md";

  fetch(readme)
    .then((res) => res.blob())
    .then((blob) => {
      var reader = new FileReader();
      reader.onload = function () {
        const adexProtocol = reader.result;
        var converter = new showdown.Converter();
        converter.setOption("ghCompatibleHeaderId", true);
        html = converter.makeHtml(adexProtocol);
        root.innerHTML += `<div class='content'>${html}</div>`;
        const pages = window.document.getElementsByClassName("break-page");
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          page.innerHTML += i + 1;
        }
      };
      reader.readAsText(blob);
    });
};
