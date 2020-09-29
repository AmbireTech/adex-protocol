window.onload = function () {
  var whitepaper = this.document.getElementById("whitepaper");
  var root = this.document.getElementById("root");

  document.getElementById("download").addEventListener("click", () => {
    // var opt = {
    //   filename: "whitepaper.pdf",
    //   image: { type: "jpeg", quality: 0.98 },
    //   html2canvas: { scale: 2 },
    //   jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    // };
    // html2pdf().from(whitepaper).set(opt).save();
    printJS({
      printable: "root",
      type: "html",
      scanStyles: false,
      showModal: true,
      header: `<div class="logo">
                <h1>AdEx: A Decentralized Ad Exchange</h1>
                <h2>Whitepaper</h2>
                <h3>By Ivo Georgiev, Dimo Stoyanov, Vanina Ivanova</h3>
               </div>`,
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
        html = converter.makeHtml(adexProtocol);
        root.innerHTML += `<div class='content'>${html}</div>`;
        console.log(html);
      };
      reader.readAsText(blob);
    });
};
