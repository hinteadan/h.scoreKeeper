(function (undefined) {
    'use strict';

    function cloneArray(source) {
        var clone = [];
        for (var i = 0; i < source.length; i++) {
            clone.push(source[i]);
        }
        return clone;
    }

    function splitArray(source, count) {
        /// <param name='source' type='Array' />
        var arrayToSplit = cloneArray(source),
            chunks = [];
        while (arrayToSplit.length) {
            chunks.push(arrayToSplit.splice(0, count));
        }
        return chunks;
    }

    function randomizeArray(source) {
        /// <param name='source' type='Array' />
        var clone = cloneArray(source),
            result = [];

        while (clone.length) {
            var index = Math.round(Math.random() * (clone.length - 1));
            result.push(clone.splice(index, 1)[0]);
        }

        return result;
    }

    this.cloneArray = cloneArray;
    this.splitArray = splitArray;
    this.randomizeArray = randomizeArray;

}).call(this);
(function (escape, undefined) {
	'use strict';

	function Individual(firstName, lastName) {
		/// <param name='firstName' type='String' />
		/// <param name='lastName' type='String' />

		function generateFullName() {
			return firstName && lastName ? firstName + ' ' + lastName :
                firstName && !lastName ? firstName :
                !firstName && lastName ? lastName :
                '<Unknown Individual>';
		}

		function generateShortName() {
			return firstName && lastName ? firstName + ' ' + lastName.substr(0, 1) + '.' :
                firstName && !lastName ? firstName :
                !firstName && lastName ? lastName :
                '<Unknown>';
		}

		function generateId() {
			return escape(generateFullName().toLowerCase().replace(/ /g, ''));
		}

		this.id = generateId;
		this.firstName = firstName;
		this.lastName = lastName;
		this.fullName = generateFullName;
		this.shortName = generateShortName;
	}

	function Party(name, details) {

		var individuals = [];

		function addIndividual(person) {
			/// <param name='person' type='Individual' />
			individuals.push(person);
		}

		function removeIndividual(person) {
			var index = individuals.indexOf(person);
			if (index < 0) {
				return;
			}
			individuals.splice(index, 1);
		}

		this.name = name;
		this.individuals = individuals;
		this.addMember = function (person) {
			addIndividual(person);
			return this;
		};
		this.addMembers = function (persons) {
			for (var i in persons) {
				addIndividual(persons[i]);
			}
			return this;
		};
		this.zapMember = function (person) {
			removeIndividual(person);
			return this;
		};
		this.zapMembers = function (persons) {
			for (var i in persons) {
				removeIndividual(persons[i]);
			}
			return this;
		};
		this.details = details || {};
	}
	Party.empty = new Party('Bye Bye');

	function Point(party, details) {
		/// <param name='party' type='Party' />
		this.party = party;
		this.timestamp = new Date();
		this.details = details || {};
	}

	function Clash(parties, details) {
		/// <param name='parties' type='Array' elementType='Party' />

		var self = this,
			points = [],
    		pointsPerParty = {};

		function checkPartyIsPartOfThisClash(party) {
			/// <param name='party' type='Party' />
			if (party) {
				for (var i in parties) {
					if (parties[i] === party) {
						return;
					}
				}
			}
			throw new Error('The given party, named <<' + party.name + '>>, is not part of this clash.');
		}

		function scorePointForPartyWithDetails(party, pointDetails) {
			/// <param name='party' type='Party' />
			checkPartyIsPartOfThisClash(party);
			var point = new Point(party, pointDetails);
			points.push(point);
			if (!pointsPerParty[party.name]) {
				pointsPerParty[party.name] = [];
			}
			pointsPerParty[party.name].push(point);
		}

		function pointsFor(party) {
			/// <param name='party' type='Party' />
			return pointsPerParty[party.name] || [];
		}

		function undoLastPoint() {
			if (!points.length) {
				return;
			}
			pointsPerParty[points.pop().party.name].pop();
		}

		function closeAndSetWinner(winner, notes) {
			checkPartyIsPartOfThisClash(winner);
			self.winner = winner;
			self.winnerNotes = notes;
		}

		function hasEnded() {
			return self.winner !== null;
		}

		//Public API
		this.details = details || {};
		this.parties = parties;
		this.points = points;
		this.pointsFor = pointsFor;
		this.pointFor = function (party) {
			scorePointForPartyWithDetails(party, undefined);
			return this;
		};
		this.pointWith = function (details) {
			return {
				for: function (party) {
					scorePointForPartyWithDetails(party, details);
					return this;
				}
			};
		};
		this.undoPoint = function () {
			undoLastPoint();
			return this;
		};
		this.close = function (winner, notes) {
			if (hasEnded()) {
				throw new Error('This clash ended already in favor of ' + self.winner.name);
			}
			closeAndSetWinner(winner, notes);
			return this;
		};
		this.hasEnded = hasEnded;
		this.winner = null;
		this.winnerNotes = null;
	}

	function Projector(clash) {
		/// <param name='clash' type='Clash' />

		function getScoreForParty(party) {
			/// <param name='party' type='Party' />
			var score = 0;
			for (var i = 0; i < clash.points().length; i++) {
				if (clash.points()[i].party !== party) {
					continue;
				}
				score++;
			}
			return score;
		}

		function ScoreInfo(party, score) {
			/// <field name='party' type='Party' />
			/// <field name='score' type='Number' />

			this.party = party;
			this.score = score;
		}

		function projectCurrentScore() {
			/// <returns type='Array' elementType='ScoreInfo' />
			var scoreArray = [];
			for (var i = 0; i < clash.parties().length; i++) {
				scoreArray.push(new ScoreInfo(
                    clash.parties()[i],
                    getScoreForParty(clash.parties()[i]))
                );
			}
			return scoreArray;
		}

		this.score = projectCurrentScore;
	}

	this.H = this.H || {};
	this.H.ScoreKeeper = this.H.ScoreKeeper || {};
	this.H.ScoreKeeper.Individual = Individual;
	this.H.ScoreKeeper.Party = Party;
	this.H.ScoreKeeper.Point = Point;
	this.H.ScoreKeeper.Clash = Clash;
	this.H.ScoreKeeper.Projector = Projector;

}).call(this, this.escape);

(function (sk, randomizeArray, splitArray, undefined) {
    'use strict';

    function RandomPartiesGenerator(individuals) {
        /// <param name='individuals' type='Array' elementType='sk.Individual' />

        function randomizeIndividuals() {
            return randomizeArray(individuals);
        }

        function randomizeChunks(chunks) {
            /// <param name='chunks' type='Array' elementType='Array' />
            for (var i in chunks) {
                chunks[i] = randomizeArray(chunks[i]);
            }
            return chunks;
        }

        function generatePartyName(partyMembers) {
            /// <param name='partyMembers' type='Array' elementType='sk.Individual' />
            var names = [];
            for (var i = 0; i < partyMembers.length; i++) {
                names.push(partyMembers[i].shortName());
            }
            return names.join('/');
        }

        function generateParties(maxMembers) {
            var teamCount = Number(maxMembers) || 2,
                members = randomizeIndividuals(),
                parties = [];

            while (members.length) {
                var partyMembers = members.splice(0, teamCount);
                parties.push(new sk.Party(generatePartyName(partyMembers)).addMembers(partyMembers));
            }

            return parties;
        }

        function pairChunksInParties(chunks) {
            /// <param name='chunks' type='Array' elementType='Array' />
            var parties = [];
            randomizeChunks(chunks);
            for (var row = 0; row < chunks[0].length; row++) {
                var members = [];
                for (var col = 0; col < chunks.length; col++) {
                    if (!chunks[col][row]) {
                        continue;
                    }
                    members.push(chunks[col][row]);
                }
                parties.push(new sk.Party(generatePartyName(members)).addMembers(members));
            }
            return parties;
        }

        this.parties = generateParties;
        this.partiesOf = function (membersCount) {
            return generateParties(membersCount);
        };
        this.cutAndPairParties = function (membersCount) {
            return pairChunksInParties(splitArray(individuals, Math.ceil(individuals.length / membersCount)));
        };
    }

    sk.Sattelites = sk.Sattelites || {};
    sk.Sattelites.RandomPartiesGenerator = RandomPartiesGenerator;

}).call(this, this.H.ScoreKeeper, this.randomizeArray, this.splitArray);
(function (sk, randomizeArray, undefined) {
    'use strict';

    function ClashFactory(parties) {
        /// <param name='parties' type='Array' elementType='sk.Party' />
        /// <returns type='Array' elementType='sk.Clash' />

        function generateRandomOneOnOneClashes() {
            var randomParties = randomizeArray(parties),
                clashes = [];

            if (randomParties.length % 2 !== 0) {
                randomParties.push(sk.Party.empty);
            }

            while (randomParties.length) {
                clashes.push(new sk.Clash(randomParties.splice(0, 2)));
                if (clashes[clashes.length - 1].parties()[1] === sk.Party.empty) {
                    clashes[clashes.length - 1].close(clashes[clashes.length - 1].parties()[0], 'No opponent, direct advance');
                }
            }
            return clashes;
        }

        return generateRandomOneOnOneClashes();
    }

    function SingleEliminationSystem(parties, clashFactory) {
        /// <param name='parties' type='Array' elementType='sk.Party' />
        /// <param name='clashFactory' type='ClashFactory' optional='true' />
        if (typeof (clashFactory) !== 'function') {
            clashFactory = ClashFactory;
        }

        /// <var type='Array' elementType='sk.Clash' />
        var initialClashes = null,
            lastProjectedRounds = null;

        function ensureInitialClashes() {
            if (initialClashes && initialClashes.length) {
                return;
            }
            initialClashes = clashFactory(parties);
        }

        function generateVirtualPartyForFutureWinnerOf(clash) {
            /// <param name='clash' type='sk.Clash' />
            var vsParts = [];
            for (var i = 0; i < clash.parties().length; i++) {
                vsParts.push(clash.parties()[i].name);
            }
            return new sk.Party('<<Winner of: ' + vsParts.join(' vs ') + '>> ', { isVirtual: true });
        }

        function isClashVirtual(clash) {
            /// <param name='clash' type='sk.Clash' />
            return clash.parties()[0].details.isVirtual === true;
        }

        function projectNextRound(currentRound, lastProjectedRound) {
            /// <param name='currentRound' type='Array' elementType='sk.Clash' />
            /// <param name='lastProjectedRound' type='Array' elementType='sk.Clash' />
            if (currentRound.length === 1) {
                throw new Error('This is the final round, there is no next round.');
            }
            var clashes = [];
            for (var i = 0; i < currentRound.length; i += 2) {
                var clash = lastProjectedRound && !isClashVirtual(lastProjectedRound[i / 2]) ?
                            lastProjectedRound[i / 2] :
                            new sk.Clash([
                    currentRound[i].winner() || generateVirtualPartyForFutureWinnerOf(currentRound[i]),
                    currentRound[i + 1] ? currentRound[i + 1].winner() || generateVirtualPartyForFutureWinnerOf(currentRound[i + 1]) : sk.Party.empty
                ]);
                clashes.push(clash);
                if (clashes[clashes.length - 1].parties()[1] === sk.Party.empty) {
                    clashes[clashes.length - 1].close(clashes[clashes.length - 1].parties()[0], 'No opponent, direct advance');
                }
            }
            return clashes;
        }

        function projectRounds() {
            ensureInitialClashes();
            if (initialClashes.length <= 1) {
                return [initialClashes];
            }

            var rounds = [initialClashes],
                nextClashes = [];

            do {
                nextClashes = projectNextRound(rounds[rounds.length - 1], lastProjectedRounds ? lastProjectedRounds[rounds.length] : null);
                rounds.push(nextClashes);
            } while (nextClashes.length > 1);

            lastProjectedRounds = rounds;

            return rounds;
        }

        function projectWinner() {
            /// <returns type='sk.Party' />
            var rounds = projectRounds(),
                finalClash = rounds[rounds.length - 1][0];
            return finalClash.winner() || generateVirtualPartyForFutureWinnerOf(finalClash);
        }

        this.rounds = projectRounds;
        this.winner = projectWinner;
    }

    sk.Logistics = sk.Logistics || {};
    sk.Logistics.SingleEliminationSystem = SingleEliminationSystem;

}).call(this, this.H.ScoreKeeper, this.randomizeArray);
(function (sk, undefined) {
    'use strict';

    function Championship(name, systemOfPlay, details) {
        /// <param name='name' type='String' />
        /// <param name='systemOfPlay' type='sk.Logistics.SingleEliminationSystem' optional='true' />
        /// <param name='details' type='Object' optional='true' />

        var parties = [];

        if (!systemOfPlay) {
            systemOfPlay = new sk.Logistics.SingleEliminationSystem(parties);
        }

        function partyExistsAlready(party) {
            return parties.indexOf(party) >= 0;
        }

        function addParty(party) {
            /// <param name='party' type='sk.Party' />
            if (partyExistsAlready(party)) {
                return;
            }
            parties.push(party);
        }

        this.name = name;
        this.details = details || {};
        this.timestamp = new Date();
        this.addParty = function (party) {
            addParty(party);
            return this;
        };
        this.addParties = function (parties) {
            /// <param name='parties' type='Array' elementType='sk.Party' />
            for (var i in parties) {
                addParty(parties[i]);
            }
            return this;
        };
        this.parties = function () {
            /// <returns type='Array' elementType='sk.Party' />
            return parties || [];
        };
        this.rounds = systemOfPlay.rounds;
        this.winner = systemOfPlay.winner;
        this.hasEnded = function () {
            var rounds = this.rounds();
            return rounds[rounds.length - 1][0].hasEnded();
        };
    }

    sk.Championship = Championship;

}).call(this, this.H.ScoreKeeper);