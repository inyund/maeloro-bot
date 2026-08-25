# MaeloRO send: same as RagexeRE_0 (master_login 0064 verified live at version 55)
package Network::Send::kRO::RagexeRE_Maelo;
use strict;
use base qw(Network::Send::kRO::RagexeRE_0);

sub new {
	my ($class) = @_;
	my $self = $class->SUPER::new(@_);
	my %packets = (
		'09A1' => ['sync_received_characters'], # reply to 0x020D charlist notify
	);
	$self->{packet_list}{$_} = $packets{$_} for keys %packets;
	return $self;
}

1;
