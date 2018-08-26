let restaurant;
let reviews;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.log("Error (window.initMap): "+error);
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

window.addEventListener('online', () => {
    DBHelper.saveAwaitingReviewFromForm();
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        return callback(null, self.restaurant)
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        callback('No restaurant id in URL', null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                return console.log("Error (fetchRestaurantFromURL): "+error);
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
    const form = document.querySelector('#review-form'); // ok
    form.action = `${DBHelper.DATABASE_URL}/reviews/`;
    DBHelper.fetchReviewsByRestaurantId(restaurant.id, (error, reviews) => {
        self.reviews = reviews;
        if (!reviews) {
            return console.log("Error (fillRestaurantHTML): "+error);
        }
        fillReviewsHTML();
    });
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

    const form = document.querySelector('#review-form'); // ok
    form.addEventListener('submit', e => {
        DBHelper.saveReviewFromForm(e, (error, review) => {
            if (review) {
                reviews.push(review);
                resetReviews(reviews);
                fillReviewsHTML();
            } else {
                return console.log("Error (fillReviewsHTML): "+error);
            }
        });
        form.reset();
    });
}

/**
 * Remove all restaurants
 */

resetReviews = (reviews) => {
    self.reviews = [];
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.id = 'reviews-list';

    container.appendChild(ul);
    self.reviews = reviews;
}

/**
 * Add reviews to site
 */
createReviewHTML = (review) => { //ok
    const li = document.createElement('li');
    const data = document.createElement('p');
    const date = new Date(review.updatedAt);
    data.innerHTML = "On : " + date.toLocaleDateString() + " " + review.name + " gave " + review.rating + " star(s) and wrote : ";
    li.appendChild(data);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu.
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