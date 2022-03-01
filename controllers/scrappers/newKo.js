import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';

function getNewKo(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  res.status(500).send({ message: `Error: NO DISPONIBLE` });
  // productCode = productCode.toUpperCase();

  // (async () => {
  //   console.log("---------------------------NEWKO---------------------------");
  //   var goOn = 0;
  //   var ms = Date.now();
  //   var mins = ms * 0.000017;

  //   var htmlCharacter = productCode.includes("%2F");
  //   if (htmlCharacter) {
  //     productCode = productCode.replace(/%2F/g, "/");
  //   }

  //   await Product.findById("NEWKO_" + productCode, (err, product) => {
  //     if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
  //     if (product == null || product.time == null) {
  //       goOn = 1;
  //     } else {
  //       var productTime = product.time;
  //       if (mins - productTime > 10 || !product) {
  //         goOn = 1;
  //         console.log("scrapeada\n");
  //       } else {
  //         goOn = 0;
  //         console.log("base de datos\n");
  //         console.log(product);
  //         res.status(200).send(product);
  //       }
  //     }
  //   });

  //   if (goOn) {
  //     var array = [];

  //     const browser = await chromium.launch({
  //       headless: true,
  //     });
  //     const page = await browser.newPage();
  //     page.setDefaultNavigationTimeout(15000);

  //     htmlCharacter = productCode.includes("%2F");
  //     if (htmlCharacter) {
  //       productCode = productCode.replace(/%2F/g, "/");
  //     }

  //     try {
  //       await page.goto(`https://ecommerce.newko.com.mx/`, {
  //         waitUntil: "load",
  //       });
  //       await page.fill("#txtUsuario", "861");
  //       await page.fill("#txtPass", "416FA407");
  //       await page.click(
  //         "body > div.col-12 > table > tbody > tr:nth-child(3) > td:nth-child(1) > form > button"
  //       );
  //       await page.waitForLoadState("networkidle");
  //     } catch (err) {
  //       console.log(
  //         `###### ${err} ###### \n ###### fallo en NEWKO en el sku: ${productCode} ######`
  //       );
  //       await browser.close();
  //       res.status(404).send({ message: `Error: No se encontró el producto: ${productCode}` });
  //       return;
  //     }
  //     try {
  //       var popUp = await page.$("#mdlEdoCta > div > div");
  //       if (popUp) {
  //         await page.click("#mdlEdoCta > div > div > div.modal-header > button");
  //       }

  //       var dolar = await page.textContent("#paridad", { timeout: 10000 });

  //       await page.fill("#txtSearchProd", `${productCode}`);
  //       await page.keyboard.press("Enter");

  //       await page.waitForTimeout(2000);

  //       var test = await page.$("#divProductos > div:nth-child(1) > div.col-md-3 > div");
  //       if (!test) {
  //         console.log("Woopsie no hay productos");
  //         await browser.close();
  //         res.status(404).send({ message: `Error: No se encontró el producto: ${productCode}` });
  //         return;
  //       }
  //       var storeId = await page.textContent(
  //         "#divProductos > div:nth-child(1) > div:nth-child(2) > div > div > div.viewed_content.text-center > h6"
  //       );

  //       storeId = storeId.replace(/(\r\n|\r|\t|\s)/gm, `${String.fromCharCode(92)} `);
  //       var sku = storeId.split(" ")[1];

  //       var backOrder = await page.$(`#backorder${storeId}`);
  //       if (backOrder) {
  //         await page.click(`#backorder${storeId}`);
  //         var storage = "Bajo pedido";
  //       }
  //       if (!backOrder) {
  //         await page.click(`#agregarCarrito${storeId}`);
  //       }

  //       var price = await page.textContent("#infoDetalle > label:nth-child(7)");
  //       var stock = await page.getAttribute("#Disponible", "value");
  //       var title = await page.textContent("#infoDetalle > div:nth-child(1)");

  //       await browser.close();
  //     } catch (err) {
  //       console.log(
  //         `###### ${err} ###### \n ###### fallo en NEWKO en el sku: ${productCode} ######`
  //       );
  //       await browser.close();
  //       res.status(500).send({ message: `Error en la busqueda del producto` });
  //       return;
  //     }

  //     try {
  //       var a = storeId.length - 1;
  //       for (var i = a; i < title.length; i++) {
  //         array.push(title[i]);
  //       }
  //       title = array.join("");

  //       dolar = dolar.replace(/[^0-9.]/g, "");
  //       dolar = parseFloat(dolar);

  //       price = price.split("$ ")[1];
  //       var usd = price.indexOf("USD");
  //       price = price.replace(/[^0-9.]/g, "");
  //       price = parseFloat(price);
  //       if (usd >= 0) {
  //         price *= dolar;
  //       }
  //     } catch (err) {
  //       console.log(
  //         `###### ${err} ###### \n ###### fallo en NEWKO en el sku: ${productCode} ######`
  //       );
  //       await browser.close();
  //       res.status(404).send({ message: `Error al manejar la informacion del producto` });
  //       return;
  //     }

  //     var product = new Product();
  //     product.store = "NEWKO";
  //     product._id = product.store + "_" + sku;
  //     product.name = title;
  //     product.sku = sku;
  //     product.price = price;
  //     product.stock = stock;
  //     product.delivery = "-";
  //     product.storage = storage;
  //     product.time = mins;

  //     console.log(product);

  //     product.save((err, newProduct) => {
  //       newProduct = product;
  //       if (err) {
  //         if (err.code == 11000) {
  //           Product.findByIdAndUpdate(
  //             product._id,
  //             {
  //               $set: {
  //                 name: title,
  //                 price: price,
  //                 stock: stock,
  //                 time: product.time,
  //                 sku: sku,
  //                 storage: storage,
  //                 delivery: "-",
  //               },
  //             },
  //             { new: true },
  //             (err2, product) => {
  //               if (err2) {
  //                 res.status(500).send({
  //                   message: `Error al actualizar el producto: ${err2}`,
  //                 });
  //               } else {
  //                 res.status(200).send(product);
  //               }
  //             }
  //           );
  //         } else {
  //           if (err) {
  //             res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
  //           }
  //         }
  //       } else {
  //         res.status(200).send(newProduct);
  //       }
  //     });
  //   }
  // })();
}

export default {
  getNewKo,
};
