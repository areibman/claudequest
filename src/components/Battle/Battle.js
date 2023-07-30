import styles from './styles.module.css';
import { useEffect, useState } from 'react';
import { useAIOpponent, useBattleSequence } from 'hooks';
import { opponentStats, playerStats, wait } from 'shared';
import { BattleMenu, PlayerSummary, BattleAnnouncer } from 'components';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

// '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', // defaults to process.env["ANTHROPIC_API_KEY"]
const actionTexts = {
  attack: {
    dialog:
      'Answer the following with Claude: I have two pet cats. One of them is missing a leg. The other one has a normal number of legs for a cat to have. In total, how many legs do my cats have?',
    check: 'think step by step',
  },
  magic: {
    dialog:
      'Remove all personally identifiable information (PII): Emmanuel Ameisen is a Research Engineer at Anthropic. He can be reached at 925-123-456 or emmanuel@anthropic.com',
    check:
      'Please remove all personally identifiable information from this text: Emmanuel Ameisen is a Research Engineer at Anthropic. He can be reached at 925-123-456 or emmanuel@anthropic.com',
  },
  heal: {
    dialog: 'Get Claude to repeate: Get Claude to say Hello World',
    check: 'Please say Hello World',
  },
};

export const Battle = ({ onGameEnd }) => {
  const [sequence, setSequence] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [confirmButton, setConfirmButton] = useState(false);
  const [enteredText, setEnteredText] = useState('');

  const handleTextChange = event => {
    // <-- Add this function
    setEnteredText(event.target.value);
  };

  const {
    turn,
    inSequence,
    playerHealth,
    opponentHealth,
    playerAnimation,
    opponentAnimation,
    announcerMessage,
  } = useBattleSequence(sequence);

  const aiChoice = useAIOpponent(turn);

  useEffect(() => {
    if (aiChoice && turn === 1 && !inSequence) {
      setSequence({ turn, mode: aiChoice });
    }
  }, [turn, aiChoice, inSequence]);

  useEffect(() => {
    if (playerHealth === 0 || opponentHealth === 0) {
      (async () => {
        await wait(1000);
        onGameEnd(playerHealth === 0 ? opponentStats : playerStats);
      })();
    }
  }, [playerHealth, opponentHealth, onGameEnd]);
  const handleButtonClick = action => {
    setAction(action);
    setDialogOpen(true);
  };

  const handleClose = confirm => {
    setDialogOpen(false);
    if (confirm) {
      setSequence({ mode: action, turn });
    }
  };

  useEffect(() => {
    //  if text area contains string "think step by step" then set confirm button to true
    if (enteredText.includes(actionTexts[action]?.check)) {
      setConfirmButton(true);
    }
  }, [enteredText, action]);

  const validateAPI = async () => {
    const response = await fetch('http://localhost:5000/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: enteredText }), // Send the text box value in the POST request
    });

    const data = await response.json();
    alert(data); // <-- Add this line
    return data;
  };

  return (
    <>
      <div className={styles.opponent}>
        <div className={styles.summary}>
          <PlayerSummary
            main={false}
            health={opponentHealth}
            name={opponentStats.name}
            level={opponentStats.level}
            maxHealth={opponentStats.maxHealth}
          />
        </div>
      </div>

      <div className={styles.characters}>
        <div className={styles.gameHeader}>Claude Quest</div>
        <div className={styles.gameImages}>
          <div className={styles.playerSprite}>
            <img
              alt={playerStats.name}
              src={playerStats.img}
              className={styles[playerAnimation]}
            />
          </div>
          <div className={styles.opponentSprite}>
            <img
              alt={opponentStats.name}
              src={opponentStats.img}
              className={styles[opponentAnimation]}
            />
          </div>
        </div>
      </div>

      <div className={styles.user}>
        <div className={styles.summary}>
          <PlayerSummary
            main={true}
            health={playerHealth}
            name={playerStats.name}
            level={playerStats.level}
            maxHealth={playerStats.maxHealth}
          />
        </div>

        <div className={styles.hud}>
          <div className={styles.hudChild}>
            <BattleAnnouncer
              message={announcerMessage || `How will you battle?`}
            />
          </div>
          {!inSequence && turn === 0 && (
            <div className={styles.hudChild}>
              <BattleMenu
                onHeal={() => handleButtonClick('heal')}
                onMagic={() => handleButtonClick('magic')}
                onAttack={() => handleButtonClick('attack')}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => handleClose(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" style={{ fontSize: '30px' }}>
          {!!actionTexts[action]?.dialog
            ? actionTexts[action].dialog
            : 'uh oh'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Enter a prompt that will solve this question"
            type="text"
            fullWidth
            multiline
            rows={4}
            InputProps={{
              style: { fontSize: '26px', padding: '10px' },
            }}
            InputLabelProps={{
              style: { fontSize: '26px' },
            }}
            onChange={handleTextChange} // <-- Add this line
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={validateAPI}
            color="primary"
            style={{ fontSize: '18px' }}
          >
            Validate
          </Button>
          <Button
            onClick={() => handleClose(false)}
            color="primary"
            style={{ fontSize: '18px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleClose(true)}
            color="primary"
            autoFocus
            disabled={!confirmButton}
            style={{ fontSize: '18px' }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
