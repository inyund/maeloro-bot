package invdump;
use strict;
use Plugins;
use Log qw(message);
use Globals;

Plugins::register('invdump', 'Dump inventory items once', \&on_unload);
my $hook = Plugins::addHook('AI_pre', \&on_ai);
my $dumped = 0;

sub on_unload { Plugins::delHook($hook); }

sub on_ai {
    return unless $net && $net->getState() == Network::IN_GAME;
    return if $dumped;
    if ($char && $char->inventory && $char->inventory->size() > 0) {
        $dumped = 1;
        message "==================== BACK'S INVENTORY ====================\n", "system";
        for my $it (@{$char->inventory->getItems()}) {
            next unless $it;
            message sprintf("INV-ITEM: %s x%d%s\n",
                $it->name() || $it->{name} || "Unknown",
                $it->{amount} || 1,
                $it->{equipped} ? " [equipped]" : ""), "system";
        }
        message "==========================================================\n", "system";
    }
}

1;
