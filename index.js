window.onload = function () {
  var whitepaper = this.document.getElementById("whitepaper");
  var root = this.document.getElementById("root");

  document.getElementById("download").addEventListener("click", () => {
    var opt = {
      filename: "whitepaper.pdf",
      //   image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(whitepaper).set(opt).save();
  });

  const readme = "./README.md";

  fetch(readme)
    .then((res) => res.blob())
    .then((blob) => {
      var reader = new FileReader();
      reader.onload = function () {
        const adexProtocol = reader.result;
        var converter = new showdown.Converter();
        html = converter.makeHtml(adexProtocol);
        root.innerHTML += html;
        console.log(html);
      };
      reader.readAsText(blob);
    });
};
