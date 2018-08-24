/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port but check your server database port first!!!
    // return `http://localhost:${port}/data/restaurants.json`; old way to get data from stage1 MWS
    return `http://localhost:${port}/restaurants`;
  }

  static openIDB() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('restaurantDb', 1, upgradeDb => {
      const store = upgradeDb.createObjectStore('restaurantDb', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');

      const newReviews = upgradeDb.createObjectStore('restaurantReviewDb', {
        keyPath: 'id'
      });
      newReviews.createIndex('restaurant_id', 'restaurant_id'); //USUNAC docelowo bylo cos innego

    });
  }

  static saveToIDB(data) {
    return DBHelper.openIDB().then(db => {
      if (!db) return console.log("Something went wrong with db");
      const tx = db.transaction('restaurantDb', 'readwrite');
      const store = tx.objectStore('restaurantDb');
      //save data (each element) in an array, in order to our IDB
      data.forEach(restaurant => {
        store.put(restaurant);
      });
      return tx.complete;
    });
  }

  static addRestaurantsFromAPI() {
    return fetch(DBHelper.DATABASE_URL)
      .then(function (response) {
        return response.json();
      }).then(restaurants => {
        // Write restaurants to IDB for time site is visited
        DBHelper.saveToIDB(restaurants);
        return restaurants;
      });
  }

  static getCachedRestaurants() {
    return DBHelper.openIDB().then(db => {
      if (!db) return console.log("Something went wrong with cachedRestaurannts");

      const store = db.transaction('restaurantDb').objectStore('restaurantDb');
      return store.getAll();
    });
  }

  /**
   * Fetch all restaurants with data from development server
   */
  static fetchRestaurants(callback) {
    return DBHelper.getCachedRestaurants().then(restaurants => {
      if (restaurants.length) {
        return Promise.resolve(restaurants);
      } else {
        return DBHelper.addRestaurantsFromAPI();
      }
    })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        console.log(`Something gone terrible wrong: ${error}`);
        callback(error, null);
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, favourite, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        if (favourite == true) { // filter by favourite
          results = results.filter(r => r.is_favorite == 'true');
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.min.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  static fileNameForRestaurant(restaurant) {
    return restaurant.photograph;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }



  // 
  // 

  static addReviewToIDB(data) { //USUNAC ok
    return DBHelper.openIDB().then(db => {
      if (!db) return;

      const tx = db.transaction('restaurantReviewDb', 'readwrite');
      const store = tx.objectStore('restaurantReviewDb');
      store.put(data);

      return tx.complete;
    })
  }

  static postReviewFromForm(body) { // USUNAC  ok  

    fetch(`http://localhost:1337/reviews/`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Accept': 'application/json , text/plain',
        'content-type': 'application/json'
      }
    })
      .then(response => {
        response.json()
          .then(data => {
            DBHelper.addReviewToIDB(data); // USUNAC ok
          })
      })
      .catch(err => {
        console.log(err);
      });

  }
  static fetchReviewsForRestaurant(id, callback) { //USUNAC ok

    return DBHelper.openIDB().then(db => {
      if (!db) return;
      const tx = db.transaction('restaurantReviewDb');
      const index = tx.objectStore('restaurantReviewDb').index('restaurant_id');

      index.getAll(id).then(results => {
        if (results && results.length < 1) {
          fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
            .then(response => {
              return response.json();
            })
            .then(reviews => {
              return DBHelper.openIDB().then(db => {
                if (!db) return;
                DBHelper.saveReviewsToIDB(reviews); //ok

                callback(null, reviews);
              });
            })
            .catch(err => {
              callback(err, null);
            })
        }
        else {
          console.log("reviews fetched");
          callback(null, results);
        }
      })
    });
  }

  static saveReviewsToIDB(data) { //USUNAC ok
    return DBHelper.openIDB().then(db => {
      if (!db) return;
      const tx = db.transaction('restaurantReviewDb', 'readwrite');
      const store = tx.objectStore('restaurantReviewDb');
      data.forEach(review => {
        store.put(review);
      });
      return tx.complete;
    });
  }

  static changeFavorite(id, status) {
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${status}`, { method: 'PUT' })
      .then(res => { return res.json() })
      .then(data => {
        return DBHelper.openIDB().then(db => {
          if (db) {
            var tx = db.transaction('restaurantDb', 'readwrite');
            var store = tx.objectStore('restaurantDb');
            store.put(data);
            return tx.complete;
          }
          else {
            return console.log("error when trying to change status favorite!");
          }
        })
          .then(location.reload());
      })
  }

}
