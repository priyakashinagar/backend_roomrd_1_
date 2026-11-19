// Every choice the app shows during sign-up / filters comes from here,
// so the app stays dynamic: change a list here and the app follows.

const OPTIONS = {
  roles: [
    { value: 'host', label: 'I have a room', subtitle: 'Find a flatmate for your place' },
    { value: 'hunter', label: 'I need a room', subtitle: 'Find a room or someone to rent with' },
  ],
  genders: ['Male', 'Female', 'Non-binary'],
  workTypes: ['Student', 'Work from home', 'Hybrid', 'Office'],
  furnishing: ['Fully furnished', 'Semi furnished', 'Unfurnished'],
  amenities: ['Wi-Fi', 'AC', 'Washing machine', 'Fridge', 'Geyser', 'Parking', 'Lift', 'Power backup', 'Housekeeping', 'Gym', 'Balcony', 'Meals'],
  pets: [
    { value: 'has_pet', label: 'I have a pet' },
    { value: 'open_to_pets', label: 'Open to pets' },
    { value: 'no_pets', label: 'No pets / allergic' },
  ],
  lifestyle: [
    { key: 'sleep', label: 'Sleep schedule', options: ['Early Bird', 'Night Owl', 'Flexible'] },
    { key: 'cleanliness', label: 'Cleanliness', options: ['Neat Freak', 'Tidy', 'Messy but clean', 'Relaxed'] },
    { key: 'food', label: 'Food preference', options: ['Veg', 'Non-Veg', 'Eggetarian', 'Vegan', 'Jain'] },
    { key: 'smoking', label: 'Smoking', options: ['Non-smoker', 'Outside only', 'Smoker'] },
    { key: 'drinking', label: 'Drinking', options: ['Never', 'Socially', 'Regularly'] },
    { key: 'guests', label: 'Guests over', options: ['Rarely', 'Sometimes', 'Often'] },
  ],
  interests: [
    'Cooking', 'Gym', 'Yoga', 'Running', 'Cricket', 'Football', 'Gaming', 'Movies', 'Netflix', 'Music',
    'Reading', 'Travel', 'Trekking', 'Photography', 'Art', 'Dancing', 'Coffee', 'Startups', 'Coding',
    'Anime', 'Board games', 'Plants', 'Pets', 'Foodie', 'Podcasts', 'Meditation',
  ],
  prompts: [
    'The perfect roommate is',
    'House rule I swear by',
    'My most irrational fear',
    'A typical Sunday for me',
    'We will get along if',
    'Dealbreaker',
    'I will make you',
    'Green flags I look for',
    'My roommate love language',
    'After work you will find me',
  ],
};

module.exports = { OPTIONS };
