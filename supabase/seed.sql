insert into public.restaurant_tables (table_number, active)
values
  ('T1', true),
  ('T2', true),
  ('T3', true),
  ('T4', true),
  ('T5', true),
  ('T6', true),
  ('T7', true),
  ('T8', true),
  ('T9', true),
  ('T10', true),
  ('T11', true),
  ('T12', true)
on conflict (table_number) do update set active = excluded.active;

insert into public.menu_categories (name, sort_order)
values
  ('Hot Coffees', 1),
  ('Frappes', 2),
  ('Iced Sections', 3),
  ('Mocktails', 4),
  ('Shakes & Smoothies', 5),
  ('Slushes', 6),
  ('Small Bites', 7),
  ('Burgers', 8),
  ('Sandwiches', 9),
  ('Pizza', 10),
  ('Pasta', 11),
  ('Desserts', 12)
on conflict (name) do update set sort_order = excluded.sort_order;

with c as (
  select id, name from public.menu_categories
)
insert into public.menu_items (
  category_id,
  name,
  description,
  image_url,
  price,
  is_veg,
  is_non_veg,
  is_bestseller,
  active
)
values
  ((select id from c where name = 'Hot Coffees'), 'Espresso', 'Bold single-shot espresso.', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', 120, true, false, true, true),
  ((select id from c where name = 'Hot Coffees'), 'Cappuccino', 'Rich foam with balanced coffee flavor.', 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800', 180, true, false, true, true),
  ((select id from c where name = 'Frappes'), 'Mocha Frappe', 'Chocolate coffee blend served chilled.', 'https://images.unsplash.com/photo-1464306076886-debede31f85b?w=800', 240, true, false, false, true),
  ((select id from c where name = 'Frappes'), 'Caramel Frappe', 'Creamy caramel frappe with whipped top.', 'https://images.unsplash.com/photo-1579888071069-c107a6f79d82?w=800', 250, true, false, true, true),
  ((select id from c where name = 'Iced Sections'), 'Iced Americano', 'Cold brew style black coffee.', 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800', 170, true, false, false, true),
  ((select id from c where name = 'Iced Sections'), 'Iced Latte', 'Smooth milk coffee over ice.', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', 210, true, false, true, true),
  ((select id from c where name = 'Mocktails'), 'Virgin Mojito', 'Mint, lime, and fizz refreshment.', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', 210, true, false, false, true),
  ((select id from c where name = 'Mocktails'), 'Berry Sparkler', 'Mixed berry fizz mocktail.', 'https://images.unsplash.com/photo-1551024709-8f23befc6cf4?w=800', 220, true, false, true, true),
  ((select id from c where name = 'Shakes & Smoothies'), 'Chocolate Shake', 'Thick dark chocolate shake.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800', 260, true, false, true, true),
  ((select id from c where name = 'Shakes & Smoothies'), 'Mango Smoothie', 'Fresh mango blended smoothie.', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800', 250, true, false, false, true),
  ((select id from c where name = 'Slushes'), 'Blue Lagoon Slush', 'Citrus mint ice slush.', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800', 190, true, false, false, true),
  ((select id from c where name = 'Slushes'), 'Watermelon Slush', 'Crushed ice watermelon cooler.', 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800', 190, true, false, true, true),
  ((select id from c where name = 'Small Bites'), 'Loaded Fries', 'Crispy fries with seasoning.', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800', 220, true, false, true, true),
  ((select id from c where name = 'Small Bites'), 'Chicken Nuggets', 'Crunchy nuggets with dip.', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800', 240, false, true, false, true),
  ((select id from c where name = 'Burgers'), 'Classic Veg Burger', 'Grilled veggie patty burger.', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800', 260, true, false, true, true),
  ((select id from c where name = 'Burgers'), 'Smoked Chicken Burger', 'Juicy chicken patty and house sauce.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 290, false, true, true, true),
  ((select id from c where name = 'Sandwiches'), 'Grilled Cheese Sandwich', 'Classic three-cheese melt.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800', 210, true, false, false, true),
  ((select id from c where name = 'Sandwiches'), 'Chicken Club Sandwich', 'Toasted triple-layer chicken sandwich.', 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=800', 260, false, true, true, true),
  ((select id from c where name = 'Pizza'), 'Margherita Pizza', 'Stone-baked margherita.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', 340, true, false, true, true),
  ((select id from c where name = 'Pizza'), 'Peri Peri Chicken Pizza', 'Spicy peri peri chicken topping.', 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800', 390, false, true, true, true),
  ((select id from c where name = 'Pasta'), 'Arrabbiata Pasta', 'Penne in spicy tomato sauce.', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800', 300, true, false, false, true),
  ((select id from c where name = 'Pasta'), 'Alfredo Chicken Pasta', 'Creamy pasta with grilled chicken.', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800', 340, false, true, true, true),
  ((select id from c where name = 'Desserts'), 'Brownie Sundae', 'Warm brownie with vanilla scoop.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', 220, true, false, true, true),
  ((select id from c where name = 'Desserts'), 'Tiramisu Jar', 'Coffee layered mascarpone dessert.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800', 240, true, false, false, true)
on conflict do nothing;
