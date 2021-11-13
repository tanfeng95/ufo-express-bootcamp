import express from 'express';
import methodOverride from 'method-override';
import { check, validationResult } from 'express-validator';
import { add, read, write } from './jsonFileStorage.js';

const app = express();
// to under json string
app.use(express.urlencoded({ extended: false }));

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

// to use ejs html files
app.set('view engine', 'ejs');

// list of all sightings
const getAllSighting = (req, res) => {
  console.log('request came in');
  read('data.json', (err, content) => {
    for (let i = 0; i < content.sightings.length; i++) {
      const oldDate = content.sightings[i].date_time;
      const newDate = oldDate.split('T');
      content.sightings[i].date_time = newDate[0];
    }
    res.render('index', content);
  });
};

const getSingleSighting = (req, res) => {
  console.log('request for single sighting');
  console.log(req.params.index);
  read('data.json', (err, content) => {
    const { sightings } = content;
    const currentSighting = sightings[req.params.index];
    const currentIndex = { index: Number(req.params.index) + 1 };
    const newSighting = { ...currentSighting, ...currentIndex };
    res.render('sightingIndex', newSighting);
  });
};

const getSightingForm = (req, res) => {
  res.render('sightingForm');
};

const postSightingForm = (req, res) => {
  console.log('post');
  console.log(req.body);
  const data = req.body;
  console.log(data);
  const now = new Date(Date.now());
  data.sightingCreatedTime = now.toLocaleString();

  const errors = validationResult(req).array();
  console.log(errors);
  if (errors.length !== 0) {
    const alert = errors;
    const newAlert = { alert };
    console.log(newAlert);
    res.render('sightingForm', newAlert);
  } else {
    add('data.json', 'sightings', req.body, (err) => {
      if (err) {
        res.status(500).send('DB write error.');
      }
    });
    res.redirect('/');
  }
};

app.use((err, req, res, next) => {
  // because err.status is undefined
  res.status(404).json({
    error: {
      message: err.message,
    },
  });
});

const getEditForm = (req, res) => {
  read('data.json', (err, content) => {
    // console.log(req.params.index)
    const { index } = req.params;
    console.log(index);
    const sighting = content.sightings[index];
    console.log(sighting);
    sighting.index = index;
    const ejsData = { sighting };
    console.log(ejsData);
    res.render('putSighting', ejsData);
  });
};

const putEditForm = (req, res) => {
  console.log('post');
  const { index } = req.params;
  console.log(index);

  read('data.json', (err, content) => {
    // console.log('request body', req.body);
    const data = req.body;
    console.log(data);
    const now = new Date(Date.now());
    data.sightingCreatedTime = now.toLocaleString();
    content.sightings[index] = req.body;

    write('data.json', content, (err) => {
    });
  });
  res.redirect('/');
};

const deleteSighting = (req, res) => {
  const { index } = req.params;
  read('data.json', (err, content) => {
    content.sightings.splice(index, 1);
    write('data.json', content, (err) => {
    });
  });
  res.redirect('/');
};

const getShapes = (req, res) => {
  console.log('request came in');
  let shapeArray = [];
  read('data.json', (err, content) => {
    const { sightings } = content;
    for (let i = 0; i < sightings.length; i += 1) {
      shapeArray.push(sightings[i].shape);
    }
    // change to set to remove all extra dupicates
    const setArray = new Set(shapeArray);
    shapeArray = [...setArray];
    const shapes = { shapes: shapeArray };
    console.log(shapes);
    res.render('listOfShapes', shapes);
  });
};

const getShape = (req, res) => {
  const allSameShapes = [];
  const { shape } = req.params;
  read('data.json', (err, content) => {
    const { sightings } = content;
    for (let i = 0; i < sightings.length; i++) {
      if (sightings[i].shape === shape) {
        console.log(sightings[i].shape);
        allSameShapes.push(sightings[i]);
      }
    }
    const allSameShapesObject = { shape: allSameShapes };
    res.render('allSameShape', allSameShapesObject);
  });
};

const getNavBar = (req, res) => {
  res.render('navBar');
};

app.get('/', getAllSighting);
app.get('/sighting/:index', getSingleSighting);
app.get('/sighting', getSightingForm);
app.post('/sighting', [
  check('text').not().isEmpty().withMessage('text is required'),
  check('shape').not().isEmpty().withMessage('shape is required'),
  check('city').not().isEmpty().withMessage('city is required'),
  check('summary').not().isEmpty().withMessage('summary is required'),
], postSightingForm);
app.get('/sighting/:index/edit', getEditForm);
app.put('/sighting/:index/edit', [
  check('text').not().isEmpty().withMessage('Name is required'),
  check('shape').not().isEmpty().withMessage('shape is required'),
  check('city').not().isEmpty().withMessage('city is required'),
  check('summary').not().isEmpty().withMessage('summary is required'),
], putEditForm);
app.delete('/sighting/:index/delete', deleteSighting);
app.get('/shapes', getShapes);
app.get('/shapes/:shape', getShape);
app.get('/nav', getNavBar);

app.listen(3004);
