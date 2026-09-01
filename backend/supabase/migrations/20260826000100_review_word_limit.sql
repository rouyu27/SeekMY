alter table public.seekmy_reviews
  drop constraint if exists seekmy_reviews_comment_check;

alter table public.seekmy_reviews
  add constraint seekmy_reviews_comment_check check (
    btrim(comment) <> '' and
    cardinality(regexp_split_to_array(btrim(comment), E'\\s+')) <= 300
  );
