let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;


  //USUNAC tutaj jest fillRestaurantFavoriteHTML();
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  const source = DBHelper.imageUrlForRestaurant(restaurant) + '.jpg';
  image.src = source;
  image.alt = restaurant.name + "restaurant main image";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //USUNAC tutaj jest DBHelper.waitingReviews();
  fetchReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {//ok
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {//ok
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => { //ok
  const li = document.createElement('li');
  const data = document.createElement('p');

  if (typeof review.date !== "undefined") {
    data.innerHTML = review.date + " " + review.name + " gave " + review.rating + " star(s) and wrote : ";
  } else {
    data.innerHTML = "Long time ago ... " + review.name + " gave " + review.rating + " star(s) and wrote : ";
  }
  li.appendChild(data);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => { //ok
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => { //ok
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


/**
 * Listening form for reviewform
 */

let form = document.querySelector('#review-form'); // ok
form.addEventListener('submit', err => {
  err.preventDefault();
  date = new Date();
  const body = {
    "restaurant_id": parseInt(getParameterByName('id')),
    "name": document.getElementById('review-name').value,
    "date": date.toDateString(),
    "rating": parseInt(document.querySelector('input[name="rating"]:checked').value),
    "comments": document.getElementById('review-text').value
  };
  const ul = document.getElementById('reviews-list');
  if (navigator.onLine) {
    DBHelper.postReviewFromForm(body); //ok
    body.createdAt = new Date();
    body.updatedAt = new Date();
  } else {
    body['updatedAt'] = new Date().getTime();
    body['createdAt'] = new Date().getTime();
    body['flag'] = 'unsynced'
  }
  ul.appendChild(createReviewHTML(body));
  form.reset();

});

/**
 * Fetching reviews
 */

fetchReviews = () => { // ok
  const id = parseInt(getParameterByName('id'));
  if (id) {
    DBHelper.fetchReviewsForRestaurant(id, (err, reviews) => {
      self.reviews = reviews;
      if (err || !reviews) {
        console.log('Fetching review with error :  ', err);
        return;
      }
      fillReviewsHTML();
    });
  } else {
    console.log('Fetching review with error :  ', err);
    return;
  }
}


/**
 * Register service worker 
 */
registerServiceWorker = () => { //ok USUNAC
  navigator.serviceWorker.register('/sw.min.js') //ok USUNAC MIN ma byc!
    .then(reg => {
      document.getElementById('review-submit').addEventListener('submit', () => {
        reg.sync.register('review-sync');
      })
    })
    .catch(err => console.log('Error when sync reviews ' + err));
}