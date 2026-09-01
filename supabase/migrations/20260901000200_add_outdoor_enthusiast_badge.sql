insert into public.seekmy_badge_definitions
  (badge_key, name, description, icon, metric, requirement, display_order, status, is_system)
values
  (
    'outdoor-enthusiast',
    'Outdoor Enthusiast',
    'Log 5 outdoor activities',
    '🌿',
    'activities',
    5,
    15,
    'active',
    false
  )
on conflict (badge_key) do nothing;
