/**
 * Master phrase list — the English source of truth.
 *
 * Every phrase has a stable id ("<category>.<slug>"). Translations live in
 * `translations/<lang>.json`, keyed by these ids. Changing the English text of
 * an existing id means every translation (and its audio) must be revisited, so
 * prefer adding a new id over rewording an old one.
 *
 * `{LANG}` in the English text stands for the target language itself
 * (e.g. "I speak a little Spanish" in the Spanish file).
 *
 * This file must stay free of runtime imports: Node scripts import it directly.
 */

export type CategoryId =
  | 'basics'
  | 'conversation'
  | 'emergency'
  | 'directions'
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'shopping'
  | 'health'
  | 'sightseeing'
  | 'numbers'
  | 'time';

export interface Category {
  id: CategoryId;
  title: string;
  blurb: string;
}

export interface Phrase {
  id: string;
  category: CategoryId;
  en: string;
  /** Context for translators and learners (shown in the app, small). */
  note?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'basics', title: 'Basics', blurb: 'Greetings and thank you' },
  { id: 'conversation', title: 'Conversation', blurb: "When you don't understand" },
  { id: 'emergency', title: 'Emergencies', blurb: 'Getting help fast' },
  { id: 'directions', title: 'Directions', blurb: 'Asking the way' },
  { id: 'transport', title: 'Transport', blurb: 'Tickets and taxis' },
  { id: 'accommodation', title: 'Accommodation', blurb: 'Hotel check-in and problems' },
  { id: 'food', title: 'Food & Drink', blurb: 'Ordering and paying' },
  { id: 'shopping', title: 'Shopping & Money', blurb: 'Prices and paying' },
  { id: 'health', title: 'Health', blurb: 'Pharmacies and symptoms' },
  { id: 'sightseeing', title: 'Sightseeing', blurb: 'Tours, museums and photos' },
  { id: 'numbers', title: 'Numbers', blurb: 'Zero to one thousand' },
  { id: 'time', title: 'Time & Days', blurb: 'Days and times' },
];

const p = (category: CategoryId, slug: string, en: string, note?: string): Phrase => ({
  id: `${category}.${slug}`,
  category,
  en,
  ...(note ? { note } : {}),
});

export const PHRASES: Phrase[] = [
  // Basics
  p('basics', 'hello', 'Hello'),
  p('basics', 'good_morning', 'Good morning'),
  p('basics', 'good_evening', 'Good evening'),
  p('basics', 'good_night', 'Good night'),
  p('basics', 'goodbye', 'Goodbye'),
  p('basics', 'see_you_later', 'See you later'),
  p('basics', 'yes', 'Yes'),
  p('basics', 'no', 'No'),
  p('basics', 'please', 'Please'),
  p('basics', 'thank_you', 'Thank you'),
  p('basics', 'thank_you_very_much', 'Thank you very much'),
  p('basics', 'youre_welcome', "You're welcome"),
  p('basics', 'excuse_me', 'Excuse me', 'To get attention or get past someone'),
  p('basics', 'sorry', "I'm sorry", 'Apologizing'),
  p('basics', 'no_problem', 'No problem'),

  // Conversation
  p('conversation', 'do_you_speak_english', 'Do you speak English?'),
  p('conversation', 'speak_a_little', 'I speak a little {LANG}.'),
  p('conversation', 'dont_understand', "I don't understand."),
  p('conversation', 'understand', 'I understand.'),
  p('conversation', 'speak_slowly', 'Could you speak more slowly, please?'),
  p('conversation', 'repeat', 'Could you repeat that, please?'),
  p('conversation', 'write_it_down', 'Could you write it down, please?'),
  p('conversation', 'what_does_this_mean', 'What does this mean?'),
  p('conversation', 'how_do_you_say', 'How do you say this in {LANG}?'),
  p('conversation', 'whats_your_name', 'What is your name?'),
  p('conversation', 'nice_to_meet_you', 'Nice to meet you.'),
  p('conversation', 'how_are_you', 'How are you?'),
  p('conversation', 'im_fine', "I'm fine, thank you."),
  p('conversation', 'where_are_you_from', 'Where are you from?'),
  p('conversation', 'im_a_tourist', "I'm a tourist."),
  p('conversation', 'first_time_here', 'This is my first time here.'),

  // Emergencies
  p('emergency', 'help', 'Help!'),
  p('emergency', 'call_police', 'Call the police!'),
  p('emergency', 'call_ambulance', 'Call an ambulance!'),
  p('emergency', 'fire', 'Fire!'),
  p('emergency', 'need_doctor', 'I need a doctor.'),
  p('emergency', 'its_an_emergency', 'It is an emergency.'),
  p('emergency', 'can_you_help_me', 'Can you help me, please?'),
  p('emergency', 'im_lost', "I'm lost."),
  p('emergency', 'wallet_stolen', 'My wallet was stolen.'),
  p('emergency', 'lost_passport', 'I lost my passport.'),
  p('emergency', 'where_hospital', 'Where is the hospital?'),
  p('emergency', 'where_police_station', 'Where is the police station?'),
  p('emergency', 'contact_embassy', 'I need to contact my embassy.'),
  p('emergency', 'use_your_phone', 'Can I use your phone?'),
  p('emergency', 'leave_me_alone', 'Leave me alone!'),

  // Directions
  p('directions', 'where_bathroom', 'Where is the bathroom?'),
  p('directions', 'where_is_this', 'Where is this?', 'Pointing at a map or address'),
  p('directions', 'how_get_to_address', 'How do I get to this address?'),
  p('directions', 'is_it_far', 'Is it far?'),
  p('directions', 'can_i_walk', 'Can I walk there?'),
  p('directions', 'show_on_map', 'Can you show me on the map?'),
  p('directions', 'left', 'Left'),
  p('directions', 'right', 'Right'),
  p('directions', 'straight_ahead', 'Straight ahead'),
  p('directions', 'turn_left', 'Turn left'),
  p('directions', 'turn_right', 'Turn right'),
  p('directions', 'here', 'Here'),
  p('directions', 'there', 'There'),
  p('directions', 'where_entrance', 'Where is the entrance?'),
  p('directions', 'where_exit', 'Where is the exit?'),
  p('directions', 'where_atm', 'Where is an ATM?'),

  // Transport
  p('transport', 'where_train_station', 'Where is the train station?'),
  p('transport', 'where_bus_stop', 'Where is the bus stop?'),
  p('transport', 'where_metro', 'Where is the metro station?', 'Subway / underground'),
  p('transport', 'one_ticket', 'One ticket, please.'),
  p('transport', 'two_tickets', 'Two tickets, please.'),
  p('transport', 'round_trip', 'A round-trip ticket, please.', 'Return ticket'),
  p('transport', 'how_much_ticket', 'How much is a ticket?'),
  p('transport', 'next_train', 'When does the next train leave?'),
  p('transport', 'which_platform', 'Which platform does it leave from?'),
  p('transport', 'does_this_go_here', 'Does this bus go here?', 'Pointing at a destination'),
  p('transport', 'need_taxi', 'I need a taxi.'),
  p('transport', 'take_me_to_address', 'Please take me to this address.'),
  p('transport', 'airport_please', 'To the airport, please.'),
  p('transport', 'how_much_will_it_cost', 'How much will it cost?'),
  p('transport', 'use_meter', 'Please use the meter.'),
  p('transport', 'stop_here', 'Please stop here.'),

  // Accommodation
  p('accommodation', 'have_reservation', 'I have a reservation.'),
  p('accommodation', 'room_available', 'Do you have a room available?'),
  p('accommodation', 'for_two_nights', 'For two nights.'),
  p('accommodation', 'price_per_night', 'How much is it per night?'),
  p('accommodation', 'breakfast_included', 'Is breakfast included?'),
  p('accommodation', 'checkout_time', 'What time is check-out?'),
  p('accommodation', 'wifi_password', 'What is the Wi-Fi password?'),
  p('accommodation', 'problem_with_room', 'There is a problem with my room.'),
  p('accommodation', 'ac_not_working', "The air conditioning doesn't work."),
  p('accommodation', 'more_towels', 'Could I have more towels, please?'),
  p('accommodation', 'lost_key', 'I lost my room key.'),
  p('accommodation', 'leave_luggage', 'Can I leave my luggage here?'),
  p('accommodation', 'call_taxi_for_me', 'Could you call a taxi for me?'),
  p('accommodation', 'check_out', "I'd like to check out."),

  // Food & Drink
  p('food', 'table_for_two', 'A table for two, please.'),
  p('food', 'menu_please', 'The menu, please.'),
  p('food', 'english_menu', 'Do you have a menu in English?'),
  p('food', 'what_do_you_recommend', 'What do you recommend?'),
  p('food', 'ill_have_this', "I'll have this, please.", 'Pointing at the menu'),
  p('food', 'water_please', 'Water, please.'),
  p('food', 'coffee_please', 'A coffee, please.'),
  p('food', 'beer_please', 'A beer, please.'),
  p('food', 'im_vegetarian', "I'm vegetarian."),
  p('food', 'allergic_nuts', "I'm allergic to nuts."),
  p('food', 'is_it_spicy', 'Is it spicy?'),
  p('food', 'not_spicy', 'Not spicy, please.'),
  p('food', 'delicious', 'It is delicious!'),
  p('food', 'cheers', 'Cheers!', 'Toast when drinking'),
  p('food', 'check_please', 'The check, please.', 'The bill'),
  p('food', 'pay_by_card', 'Can I pay by card?'),

  // Shopping & Money
  p('shopping', 'how_much', 'How much is this?'),
  p('shopping', 'too_expensive', 'That is too expensive.'),
  p('shopping', 'lower_price', 'Can you lower the price?'),
  p('shopping', 'just_looking', "I'm just looking, thank you."),
  p('shopping', 'ill_take_it', "I'll take it."),
  p('shopping', 'accept_cards', 'Do you accept credit cards?'),
  p('shopping', 'pay_cash', "I'll pay in cash."),
  p('shopping', 'receipt', 'Can I have a receipt, please?'),
  p('shopping', 'bag', 'Can I have a bag, please?'),
  p('shopping', 'try_on', 'Can I try this on?'),
  p('shopping', 'other_size', 'Do you have this in another size?'),
  p('shopping', 'what_time_open', 'What time do you open?'),
  p('shopping', 'what_time_close', 'What time do you close?'),
  p('shopping', 'exchange_money', 'Where can I exchange money?'),
  p('shopping', 'sim_card', 'Where can I buy a SIM card?'),

  // Health
  p('health', 'where_pharmacy', 'Where is the pharmacy?'),
  p('health', 'feel_sick', "I don't feel well."),
  p('health', 'headache', 'I have a headache.'),
  p('health', 'stomachache', 'I have a stomachache.'),
  p('health', 'fever', 'I have a fever.'),
  p('health', 'cold', 'I have a cold.'),
  p('health', 'hurts_here', 'It hurts here.'),
  p('health', 'medicine_for_this', 'Do you have medicine for this?'),
  p('health', 'allergic_penicillin', "I'm allergic to penicillin."),
  p('health', 'diabetic', "I'm diabetic."),
  p('health', 'pregnant', "I'm pregnant."),
  p('health', 'need_dentist', 'I need a dentist.'),
  p('health', 'travel_insurance', 'I have travel insurance.'),
  p('health', 'need_prescription', 'Do I need a prescription?'),

  // Sightseeing
  p('sightseeing', 'tourist_info', 'Where is the tourist information office?'),
  p('sightseeing', 'entrance_fee', 'How much is the entrance fee?'),
  p('sightseeing', 'opening_hours', 'What are the opening hours?'),
  p('sightseeing', 'student_discount', 'Is there a student discount?'),
  p('sightseeing', 'guided_tour', 'Is there a guided tour in English?'),
  p('sightseeing', 'worth_seeing', 'What is worth seeing around here?'),
  p('sightseeing', 'can_i_take_photo', 'Can I take a photo?'),
  p('sightseeing', 'take_our_photo', 'Could you take a photo of us?'),
  p('sightseeing', 'where_museum', 'Where is the museum?'),
  p('sightseeing', 'where_beach', 'Where is the beach?'),

  // Numbers
  p('numbers', '0', 'Zero (0)'),
  p('numbers', '1', 'One (1)'),
  p('numbers', '2', 'Two (2)'),
  p('numbers', '3', 'Three (3)'),
  p('numbers', '4', 'Four (4)'),
  p('numbers', '5', 'Five (5)'),
  p('numbers', '6', 'Six (6)'),
  p('numbers', '7', 'Seven (7)'),
  p('numbers', '8', 'Eight (8)'),
  p('numbers', '9', 'Nine (9)'),
  p('numbers', '10', 'Ten (10)'),
  p('numbers', '20', 'Twenty (20)'),
  p('numbers', '50', 'Fifty (50)'),
  p('numbers', '100', 'One hundred (100)'),
  p('numbers', '1000', 'One thousand (1,000)'),

  // Time & Days
  p('time', 'what_time_is_it', 'What time is it?'),
  p('time', 'how_long', 'How long does it take?'),
  p('time', 'one_moment', 'One moment, please.'),
  p('time', 'now', 'Now'),
  p('time', 'later', 'Later'),
  p('time', 'today', 'Today'),
  p('time', 'tomorrow', 'Tomorrow'),
  p('time', 'yesterday', 'Yesterday'),
  p('time', 'monday', 'Monday'),
  p('time', 'tuesday', 'Tuesday'),
  p('time', 'wednesday', 'Wednesday'),
  p('time', 'thursday', 'Thursday'),
  p('time', 'friday', 'Friday'),
  p('time', 'saturday', 'Saturday'),
  p('time', 'sunday', 'Sunday'),
];
