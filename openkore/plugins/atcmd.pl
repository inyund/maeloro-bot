package atcmd;
use strict;
use Plugins;
use Log qw(message);
use Globals;
use Utils;

Plugins::register('atcmd', 'Run one @command and mark output', \&on_unload);
my $hook = Plugins::addHook('AI_pre', \&on_ai);
my $done = 0;

sub on_unload { Plugins::delHook($hook); }

sub on_ai {
    return unless $net && $net->getState() == Network::IN_GAME;
    return if $done;
    $done = 1;
    my $cmd = $::atcmd_query || '@go';
    message "ATCMD_SEND: $cmd\n", "system";
    Commands::run("c $cmd");
    message "ATCMD_SENT\n", "system";
}

1;
