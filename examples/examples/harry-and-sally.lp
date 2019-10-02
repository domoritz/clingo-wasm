% instance
motive(harry).
motive(sally).
guilty(harry).

% encoding
innocent(Suspect) :- motive(Suspect), not guilty(Suspect).
