import 'dotenv/config';

import SerpApi from 'google-search-results-nodejs';

function getImages(req, res, err) {
  let sku = req.params.sku;
  const search = new SerpApi.GoogleSearch(`${process.env.SERAPI_KEY}`);
  var array = [];

  const params = {
    q: `${sku}`,
    tbm: 'isch',
    ijn: '0',
  };

  const callback = function (data) {
    for (var i = 0; i < 10; i++) {
      var position = data.images_results[i].position;
      var source = data.images_results[i].source;
      var title = data.images_results[i].title;
      var originalImg = data.images_results[i].original;

      array.push({
        Position: position,
        Source: source,
        Tilte: title,
        Image: originalImg,
      });
    }

    res.status(200).send(array);
  };
  search.json(params, callback);
}

export default {
  getImages,
};
