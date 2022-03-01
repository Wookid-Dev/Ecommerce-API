import express from 'express';
import userCtrl from '../controllers/users/user.js';
import auth from '../middlewares/auth.js';

//----------------------------------------PROMOS---------------------------------------

import productCtrlCyberpuerta from '../controllers/scrappers/cyberpuerta.js';
import productCtrlIntercompras from '../controllers/scrappers/intercompras.js';
import productCtrlSams from '../controllers/scrappers/sams.js';
import productCtrlOfficedepot from '../controllers/scrappers/officedepot.js';
import productCtrlWalmart from '../controllers/scrappers/walmart.js';
import productCtrlCostco from '../controllers/scrappers/costco.js';
import productCtrlPcel from '../controllers/scrappers/pcel.js';
import productCtrlPch from '../controllers/scrappers/pch.js';
import productCtrlIngram from '../controllers/scrappers/ingram.js';

import productCtrlDcm from '../controllers/mayoristas/dcm/dcm.js';
import productCtrlCva from '../controllers/mayoristas/cva/cva.js';
import cvaInfoCtrl from '../controllers/mayoristas/cva/cvaTest.js';
import productCtrlExel from '../controllers/mayoristas/exel/exel.js';
import productCtrlTeam from '../controllers/mayoristas/team.js';
import productCtrlIntcomex from '../controllers/mayoristas/intcomex.js';
import productCtrlCt from '../controllers/mayoristas/ct/ct.js';
import skuCtrlCt from '../controllers/mayoristas/ct/getCtSku.js';
import productCtrlPcConsumibles from '../controllers/scrappers/pcConsumibles.js';
import productCtrlAzerty from '../controllers/scrappers/azerty.js';
import productCtrlCompuSoluciones from '../controllers/scrappers/compuSoluciones.js';
import productCtrlNewKo from '../controllers/scrappers/newKo.js';

import brandsCtrlExel from '../controllers/mayoristas/exel/exelMarcas.js';
import brandsCtrlCva from '../controllers/mayoristas/cva/cvaMarcas.js';

//----------------------------------------PROMOS---------------------------------------
import promoCtrlCt from '../controllers/mayoristas/ct/promosDownloadCt.js';
import promoCtrlCva from '../controllers/mayoristas/cva/promosDownloadCva.js';

import exchangeCtrlCt from '../controllers/mayoristas/ct/exchange.js';

import catalogCtrlDcm from '../controllers/mayoristas/dcm/dcmCatalog.js';
//----------------------------------------GOOGLE---------------------------------------

import productCtrlImages from '../controllers/google/googleImages.js';
import productCtrlSheets from '../controllers/google/googleSheets.js';
import productCtrlShopping from '../controllers/google/googleShopping.js';

//----------------------------------------MODIFICADORES---------------------------------

import modifierGet from '../controllers/modifiers/get.js';
import modifierSave from '../controllers/modifiers/save.js';
import modifierDelete from '../controllers/modifiers/delete.js';
import modifierUpdate from '../controllers/modifiers/update.js';

import sendEmailCtrl from '../controllers/emails/sendEmails.js';
import test from '../controllers/emails/sendEmailtest.js';

//----------------------------------------APARTADOS, ORDENES DE COMPRA Y CONFIRMACIONES------------------
import buyOrderCtrlCt from '../controllers/mayoristas/buyOrders/buyOrderCt.js';
import buyOrderCtrlIntcomex from '../controllers/mayoristas/buyOrders/buyOrderIntcomex.js';
import buyOrderCtrlDcm from '../controllers/mayoristas/buyOrders/buyOrderDcm.js';

import buyOrderCtrlExel from '../controllers/mayoristas/buyOrders/buyOrderExel.js';
import preBuyOrderCtrlExel from '../controllers/mayoristas/buyOrders/preBuyOrderExel.js';

import confirmationCtrlExel from '../controllers/mayoristas/buyOrders/confirmacionExel.js';
import confirmationCtrlCt from '../controllers/mayoristas/buyOrders/confirmacionCt.js';

//----------------------------------------ROUTES-----------------------------------------
const api = express.Router();

api.post('/signup', userCtrl.signUp);
api.post('/signin', userCtrl.signIn);

api.get('/product', auth, modifierGet.getProducts);
api.get('/product/:productId', auth, modifierGet.getProduct);
api.post('/product', auth, modifierSave.saveProduct);
api.put('/product/:productId', auth, modifierUpdate.updateProduct);
api.delete('/product/:productId', auth, modifierDelete.deleteProduct);

api.get('/product/image/:sku', auth, productCtrlImages.getImages);
api.get('/google/productsheet/', auth, productCtrlSheets.getSheet);
api.get('/products/googleShoping/:sku', auth, productCtrlShopping.getGoogleShoppingProduct);

api.get('/product/ingram/:sku', auth, productCtrlIngram.getIngram);
api.get('/product/cyberpuerta/:sku', auth, productCtrlCyberpuerta.getCyberpuerta);
api.get('/product/pch/:sku', auth, productCtrlPch.getPch);
api.get('/product/pcel/:sku', auth, productCtrlPcel.getPcel);
api.get('/product/intercompras/:sku', auth, productCtrlIntercompras.getIntercompras);
api.get('/product/sams/:sku', auth, productCtrlSams.getSams);
api.get('/product/officedepot/:sku', auth, productCtrlOfficedepot.getOfficeDepot);
api.get('/product/walmart/:sku', auth, productCtrlWalmart.getWalmart);
api.get('/product/costco/:sku', auth, productCtrlCostco.getCostco);
api.get('/product/pcconsumibles/:sku', auth, productCtrlPcConsumibles.getPcConsumibles);
api.get('/product/azerty/:sku', auth, productCtrlAzerty.getAzerty);
api.get('/product/compusoluciones/:sku', auth, productCtrlCompuSoluciones.getCompuSoluciones);
api.get('/product/newko/:sku', auth, productCtrlNewKo.getNewKo);

api.get('/product/dcm/:sku', auth, productCtrlDcm.getProductDcm);
api.get('/catalog/dcm', auth, catalogCtrlDcm.catalogCtrlDcm);

api.get('/product/cva/:sku', auth, productCtrlCva.getProductCva);
api.get('/info/product/cva/:sku', auth, cvaInfoCtrl.cvaInfo);

api.get('/product/exel/:sku', auth, productCtrlExel.getProductExel);
api.get('/product/team/:sku', auth, productCtrlTeam.getProductTeam);
api.get('/product/intcomex/:sku', auth, productCtrlIntcomex.getProductIntcomex);
api.get('/product/ct/token/', auth, productCtrlCt.getCt);
api.get('/product/ct/:sku', auth, productCtrlCt.getProductCt);
api.get('/sku/ct/:sku', auth, skuCtrlCt.getCtSku);

api.get('/exchange/ct/', auth, exchangeCtrlCt.getExchangeCt);

api.get('/promo/ct/', auth, promoCtrlCt.getPromoCt);
api.get('/promo/cva/', auth, promoCtrlCva.getPromoCva);

api.get('/marcas/exel/', auth, brandsCtrlExel.getMarcasExel);
api.get('/marcas/cva/', auth, brandsCtrlCva.getMarcasCva);

api.get('/buyorder/exel/pedido', auth, buyOrderCtrlExel.postBuyOrderExel);
api.get('/prebuyorder/exel/preordendecompra', auth, preBuyOrderCtrlExel.postPreBuyOrderExel);
api.get('/prebuyorder/exel/confirmacion', auth, confirmationCtrlExel.postConfirmationExel);

api.get('/buyorder/ct/pedido', auth, buyOrderCtrlCt.postBuyOrderCT);
api.get('/buyorder/ct/pedido/confirmacion', auth, confirmationCtrlCt.postConfirmationCt);

api.get('/buyorder/dcm/pedido', auth, buyOrderCtrlDcm.postBuyOrderDcm);
api.get('/buyorder/intcomex/pedido', auth, buyOrderCtrlIntcomex.postBuyOrderIntcomex);

api.post('/email/send', sendEmailCtrl.sendEmail);
api.post('/email/test', test.sendEmailTest);

export default api;
