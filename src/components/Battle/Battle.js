import styles from './styles.module.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAIOpponent, useBattleSequence } from 'hooks';
import { opponentStats, playerStats, wait } from 'shared';
import { BattleMenu, PlayerSummary, BattleAnnouncer } from 'components';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey:
    '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', // defaults to process.env["ANTHROPIC_API_KEY"]
});

export const Battle = ({ onGameEnd }) => {
  const [sequence, setSequence] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [confirmButton, setConfirmButton] = useState(false);

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

  const validateAPI = async () => {
    const completion = await anthropic.completions.create({
      model: 'claude-2',
      max_tokens_to_sample: 1024,
      prompt: `${Anthropic.HUMAN_PROMPT} how does a court case get to the Supreme Court? ${Anthropic.AI_PROMPT}`,
    });
    // return completion.data.choices[0].text;
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
        <DialogTitle
          id="alert-dialog-title"
          style={{ fontSize: '30px' }}
        >{`I have two pet cats. One of them is missing a leg. The other one has a normal number of legs for a cat to have. In total, how many legs do my cats have?`}</DialogTitle>
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
            style={{ fontSize: '18px' }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};