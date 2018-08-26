/**
 * Common database helper  functions.
 */
let awaitingReviewId = 0;
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port but check your server database port first!!!
        // return `http://localhost:${port}/data/restaurants.json`; old way to get data from stage1 MWS
        return `http://localhost:${port}`;
    }

    /**
  * Fetch all restaurants with data from development server
  */
    static fetchRestaurantsFromDb(callback) {
        // return to fetch restaurants when IndexeddB is not supported -> see MWS Stage 1
        if (!('indexedDB' in window)) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
            xhr.onload = () => {
                if (xhr.status === 200) { // Got a success response from server!
                    callback(null, JSON.parse(xhr.responseText));
                } else { // Oops!. Got an error from server.
                    const error = (`Error (fetchRestaurantsFromDb): ${xhr.status}`);
                    callback(error, null);
                }
            };
            return xhr.send();
        }
        //fetch data when IndexedDb is supported
        idb.open('restaurantsDb', 1, upgradeDb => {
            upgradeDb.createObjectStore('restaurantsDb', { keyPath: 'id' });
        }).then(db => {
            var tx = db.transaction('restaurantsDb', 'readonly');
            var dbStore = tx.objectStore('restaurantsDb');
            dbStore.getAll().then(DataFromIdb => {
                if (DataFromIdb && DataFromIdb.length < 1) {
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            var tx = db.transaction('restaurantsDb', 'readwrite');
                            var dbStore = tx.objectStore('restaurantsDb');
                            const json = JSON.parse(xhr.responseText);
                            json.forEach(element => {
                                dbStore.put(element);
                            });
                            dbStore.getAll().then(restaurants => {
                                callback(null, restaurants);
                            })
                        } else {
                            const error = (`Error (fetchRestaurantsFromDb): ${xhr.status}`);
                            callback(error, null);
                        }
                    };
                    xhr.send();
                } else {
                    callback(null, DataFromIdb);
                }
            });
        });
    }

    /**
  * Fetch all reviews with data from development server
  */

    static fetchReviewsFromDb(callback) {
        // return to fetch reviews when IndexeddB is not supported
        if (!('indexedDB' in window)) {
            fetch(`${DBHelper.DATABASE_URL}/reviews`).then(response => {
                return response.json();
            }).then(reviews => {
                callback(null, reviews);
            }).catch(error => {
                callback(error, null);
            });
        } else {
            idb.open('reviewsDb', 1, upgradeDb => {
                upgradeDb.createObjectStore('reviewsDb', { keyPath: 'id' });
            }).then(db => {
                var tx = db.transaction('reviewsDb', 'readonly');
                var dbStore = tx.objectStore('reviewsDb');
                dbStore.getAll().then(DataFromIdb => {
                    if (DataFromIdb && DataFromIdb.length < 1) {
                        fetch(`${DBHelper.DATABASE_URL}/reviews`).then(response => {
                            return response.json();
                        }).then(reviews => {
                            var tx = db.transaction('reviewsDb', 'readwrite');
                            var dbStore = tx.objectStore('reviewsDb');
                            reviews.forEach(review => {
                                dbStore.put(review);
                            });
                            dbStore.getAll().then(reviews => {
                                callback(null, reviews);
                            });
                        }).catch(error => {
                            callback(error, null);
                        });
                    } else {
                        callback(null, DataFromIdb);
                    }
                });
            });
        }
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
     * Fetch a review by restaurantID.
     */
    static fetchReviewsByRestaurantId(id, callback) {
        // fetch all reviews with proper error handling.
        DBHelper.fetchReviewsFromDb((error, reviewss) => {
            if (error) {
                callback(error, null);
            } else {
                const reviews = reviewss.filter(r => r.restaurant_id == id);
                if (reviews) { // Got the reviews
                    callback(null, reviews);
                } else { // Restaurant does not have reviews yet
                    callback('Restaurant does not have reviews yet', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
        DBHelper.fetchRestaurantsFromDb((error, restaurants) => {
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
     * Save review 
     */
    static saveReviewFromForm(e, callback) {
        e.preventDefault();
        let name = document.getElementById('review-name').value;
        let rating = parseInt(document.querySelector('input[name="rating"]:checked').value);
        let comments = document.getElementById('review-text').value;
        let restaurant_id = parseInt(getParameterByName('id'));
        let updatedAt = new Date();
        let body = new FormData();
        body.append('restaurant_id', restaurant_id);
        body.append('name', name);
        body.append('rating', rating);
        body.append('comments', comments);
        fetch(`${DBHelper.DATABASE_URL}/reviews`, { method: 'POST', body: body }).then(response => {
            return response.json();
        }).then(review => {
            if (('indexedDB' in window)) {
                idb.open('reviewsDb', 1, upgradeDb => {
                    upgradeDb.createObjectStore('reviewsDb', { keyPath: 'id' });
                }).then(db => {
                    var tx = db.transaction('reviewsDb', 'readwrite');
                    var dbStore = tx.objectStore('reviewsDb');
                    dbStore.put(review);
                    callback(null, review);
                });
            }
        }).catch(() => { //when offline
            const awaitingReview = {
                id: awaitingReviewId + 1,
                restaurant_id: restaurant_id,
                name: name,
                rating: rating,
                comments: comments,
                updatedAt: updatedAt,
                createdAt: updatedAt
            }
            awaitingReviewId = awaitingReview.id;
            if (('indexedDB' in window)) {
                idb.open('awaitingReviews', 1, upgradeDb => {
                    upgradeDb.createObjectStore('awaitingReviews', { keyPath: 'id' });
                }).then(db => {
                    var tx = db.transaction('awaitingReviews', 'readwrite');
                    var dbStore = tx.objectStore('awaitingReviews');
                    dbStore.put(awaitingReview);
                    callback(null, awaitingReview);
                });
            } else {
                const error = "Error (saveReviewFromForm)";
                callback(error, null);
            }
        });
    }

    /**
 * save rewiev after back online
 */

    static saveAwaitingReviewFromForm() {
        if (('indexedDB' in window)) {
            idb.open('awaitingReviews', 1, upgradeDb => {
                upgradeDb.createObjectStore('awaitingReviews', { keyPath: 'id' });
            }).then(db => {
                var tx = db.transaction('awaitingReviews', 'readwrite');
                var dbStore = tx.objectStore('awaitingReviews');
                dbStore.getAll().then(DataFromIdb => {
                    if (DataFromIdb && DataFromIdb.length > 0) {
                        DataFromIdb.forEach(awaitingReview => {
                            let date = new Date();
                            let restaurant_id = awaitingReview.restaurant_id;
                            let name = awaitingReview.name;
                            let rating = awaitingReview.rating;
                            let comments = awaitingReview.comments;

                            let dateComment = date.toDateString();
                            let body = new FormData();
                            body.append('restaurant_id', restaurant_id);
                            body.append('name', name);
                            body.append('rating', rating);
                            body.append('date', dateComment);
                            body.append('comments', comments);

                            fetch(`${DBHelper.DATABASE_URL}/reviews`, { method: 'POST', body: body }).then(response => {
                                return response.json();
                            }).then(review => {
                                if (('indexedDB' in window)) {
                                    idb.open('reviewsDb', 1, upgradeDbFinal => {
                                        upgradeDbFinal.createObjectStore('reviewsDb', { keyPath: 'id' });
                                    }).then(dbFinal => {
                                        var txFinal = dbFinal.transaction('reviewsDb', 'readwrite');
                                        var dbStoreFinal = txFinal.objectStore('reviewsDb');
                                        dbStoreFinal.put(review);
                                    });
                                }
                            }).catch(error => {
                                return console.log("Error (saveAwaitingReviewFromForm): " + error);
                            });
                        });
                    }
                });
                dbStore.clear();
            });
        }
    }
    /**
 * Changing favorite restaurant
 */

    static changeFavorite(id, status) {
        fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${status}`, { method: 'PUT' })
            .then(res => { return res.json() })
            .then(data => {
                idb.open('restaurantsDb', 1, upgradeDb => {
                    const store = upgradeDb.createObjectStore('restaurantsDb', {
                        keyPath: 'id'
                    });
                    store.createIndex('by-id', 'id');
                }).then(db => {
                    if (db) {
                        var tx = db.transaction('restaurantsDb', 'readwrite');
                        var store = tx.objectStore('restaurantsDb');
                        store.put(data);
                        return tx.complete;
                    }
                    else {
                        return console.log("Error (changeFavorite): ");
                    }
                })
                    .then(location.reload());
            })
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
        });
        return marker;
    }
}