-- Seed 2000+ members with 6-year span of join dates
-- Run in Supabase Dashboard > SQL Editor

DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','David','Elizabeth',
    'William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen',
    'Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
    'Donald','Ashley','Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle',
    'Kenneth','Carol','Kevin','Amanda','Brian','Dorothy','George','Melissa','Timothy','Deborah',
    'Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia',
    'Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna',
    'Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen',
    'Benjamin','Samantha','Samuel','Katherine','Raymond','Christine','Gregory','Debra','Frank','Rachel',
    'Alexander','Carolyn','Patrick','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather',
    'Tyler','Diane','Aaron','Ruth','Jose','Olivia','Nathan','Julie','Henry','Joyce',
    'Douglas','Virginia','Zachary','Victoria','Peter','Kelly','Kyle','Lauren','Ethan','Rose',
    'Juan','Megan','Charlie','Alice','Carl','Julia','Dylan','Jean','Luis','Evelyn',
    'Adrian','Abigail','Gabriel','Isabella','Bruce','Madison','Wayne','Avery','Randy','Ella',
    'Roy','Scarlett','Vincent','Grace','Russell','Chloe','Mason','Victoria','Luke','Riley',
    'Chase','Aria','Cole','Lily','Diego','Aurora','Bryan','Zoey','Austin','Nora',
    'Mario','Camila','Jorge','Penelope','Ricardo','Layla','Fernando','Sofia','Jesus','Harper',
    'Cesar','Elena','Javier','Ariana','Marco','Lucy','Derek','Claire','Erik','Sara',
    'Ray','Giana','Miles','Hannah','Micah','Lillian','Kai','Addison','Sergio','Bella',
    'Damian','Natalie','Francisco','Savannah','Cristian','Brooklyn','Ivan','Leah','Edwin','Audrey',
    'Omar','Stella','Andre','Paisley','Ismael','Hazel','Julius','Ellie','Maurice','Anna'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
    'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
    'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
    'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
    'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes',
    'Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper',
    'Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson',
    'Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes',
    'Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez',
    'Jenkins','Powell','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes',
    'Gonzales','Fisher','Hicks','Webb','Crawford','Henry','Boyd','Mason','Morales','Kennedy',
    'Warren','Dixon','Ramos','Reyes','Burns','Gordon','Shaw','Holmes','Rice','Robertson',
    'Hunt','Black','Daniels','Palmer','Mills','Nichols','Grant','Knight','Ferguson','Rose',
    'Stone','Hawkins','Dunn','Perkins','Hudson','Spencer','Gardner','Stephens','Payne','Pierce',
    'Berry','Matthews','Arnold','Wagner','Willis','Ray','Watkins','Olson','Carroll','Duncan',
    'Snyder','Hart','Cunningham','Bradley','Lane','Andrews','Ruiz','Harper','Fox','Riley',
    'Armstrong','Carpenter','Weaver','Greene','Lawrence','Elliott','Chavez','Sims','Austin','Peters',
    'Kelley','Franklin','Lawson','Fields','Gutierrez','Vasquez','Cruz','Obrien','Abbott','Liu',
    'Graham','Holmes','Ramos','Medina','Woods','Valdez','Castillo','Ramsey','Bishop','Salazar'
  ];
  mtypes TEXT[] := ARRAY['basic','basic','basic','basic','basic','premium','premium','vip'];
  fn TEXT; ln TEXT; mtype TEXT; email TEXT; phone TEXT; mid TEXT;
  join_date DATE; is_active BOOLEAN;
  total INT := 2100;
  i INT;
BEGIN
  FOR i IN 1..total LOOP
    fn := first_names[1 + floor(random() * array_length(first_names, 1))];
    ln := last_names[1 + floor(random() * array_length(last_names, 1))];
    mtype := mtypes[1 + floor(random() * array_length(mtypes, 1))];
    mid := 'M' || LPAD(i::text, 6, '0');
    email := LOWER(fn || '.' || ln || floor(random() * 999)::int || '@email.com');
    phone := '555-' || LPAD(floor(random() * 9000 + 1000)::int::text, 4, '0');
    join_date := DATE '2020-01-01' + floor(random() * 2190)::int;
    is_active := random() < 0.85;

    BEGIN
      INSERT INTO public.members (member_id, first_name, last_name, email, phone, membership_type, is_active, join_date)
      VALUES (mid, fn, ln, email, phone, mtype, is_active, join_date)
      ON CONFLICT (member_id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
      -- skip duplicates
    END;

    IF i % 100 = 0 THEN
      RAISE NOTICE 'Inserted % / % members', i, total;
    END IF;
  END LOOP;
END $$;
